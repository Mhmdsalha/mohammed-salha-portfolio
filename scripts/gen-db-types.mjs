// Generates src/types/database.ts from supabase/migrations (D1-2, D-028).
//
//   node scripts/gen-db-types.mjs          writes the file
//   node scripts/gen-db-types.mjs --check  fails if the file is out of date (also a unit test)
//
// The migrations run in PGlite (real Postgres, in memory), and the schema is read back from the
// catalog, in the format `supabase gen types typescript` produces. It needs no Supabase login or
// Docker, and CI can prove the committed types match the migrations.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import prettier from "prettier";

const ROOT = new URL("../", import.meta.url);
const MIGRATIONS = new URL("supabase/migrations/", ROOT);
export const OUTPUT = fileURLToPath(new URL("src/types/database.ts", ROOT));

const TS_TYPES = {
  uuid: "string",
  text: "string",
  varchar: "string",
  bpchar: "string",
  int2: "number",
  int4: "number",
  int8: "number",
  float4: "number",
  float8: "number",
  numeric: "number",
  bool: "boolean",
  date: "string",
  timestamp: "string",
  timestamptz: "string",
  json: "Json",
  jsonb: "Json"
};

function tsType(udt) {
  if (udt.startsWith("_")) return `${tsType(udt.slice(1))}[]`;
  const type = TS_TYPES[udt];
  if (!type) throw new Error(`gen-db-types: no TypeScript mapping for Postgres type "${udt}"`);
  return type;
}

const key = (name) => (/^[a-z_][a-z0-9_]*$/i.test(name) ? name : JSON.stringify(name));

/** Applies every migration, in name order, to a fresh database with Supabase's API roles. */
export async function migratedDatabase() {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;" +
      "grant usage on schema public to anon, authenticated, service_role;"
  );
  const files = (await readdir(MIGRATIONS)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(new URL(file, MIGRATIONS), "utf8"));
  }
  return db;
}

async function readSchema(db) {
  const { rows: columns } = await db.query(`
    select table_name, column_name, udt_name, is_nullable = 'YES' as nullable,
      column_default is not null or is_identity = 'YES' as has_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
      )
    order by table_name, ordinal_position`);

  const { rows: foreignKeys } = await db.query(`
    select con.conname as name, rel.relname as table_name, ref.relname as referenced,
      array(select a.attname from unnest(con.conkey) with ordinality k(n, i)
            join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.n order by k.i) as columns,
      array(select a.attname from unnest(con.confkey) with ordinality k(n, i)
            join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.n order by k.i)
        as referenced_columns
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_class ref on ref.oid = con.confrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where con.contype = 'f' and ns.nspname = 'public'
    order by rel.relname, con.conname`);

  const { rows: functions } = await db.query(`
    select p.proname as name, p.proretset as returns_set, format_type(p.prorettype, null) as returns,
      coalesce((
        select json_agg(json_build_object('name', x.name, 'type', t.typname, 'mode', x.mode)
                        order by x.i)
        from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[]), p.proargnames,
                    coalesce(p.proargmodes, array_fill('i'::"char", array[p.pronargs])))
             with ordinality as x(type, name, mode, i)
        join pg_type t on t.oid = x.type
      ), '[]') as args
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.prokind = 'f'
      and format_type(p.prorettype, null) <> 'trigger'
    order by p.proname`);

  return { columns, foreignKeys, functions };
}

function render({ columns, foreignKeys, functions }) {
  const tables = new Map();
  for (const column of columns) {
    if (!tables.has(column.table_name)) tables.set(column.table_name, []);
    tables.get(column.table_name).push(column);
  }

  const tableBlocks = [...tables].map(([table, cols]) => {
    const row = cols
      .map((c) => `${key(c.column_name)}: ${tsType(c.udt_name)}${c.nullable ? " | null" : ""}`)
      .join("\n");
    const insert = cols
      .map(
        (c) =>
          `${key(c.column_name)}${c.nullable || c.has_default ? "?" : ""}: ${tsType(c.udt_name)}${
            c.nullable ? " | null" : ""
          }`
      )
      .join("\n");
    const update = cols
      .map((c) => `${key(c.column_name)}?: ${tsType(c.udt_name)}${c.nullable ? " | null" : ""}`)
      .join("\n");
    const relationships = foreignKeys
      .filter((fk) => fk.table_name === table)
      .map(
        (fk) => `{
          foreignKeyName: ${JSON.stringify(fk.name)}
          columns: ${JSON.stringify(fk.columns)}
          isOneToOne: false
          referencedRelation: ${JSON.stringify(fk.referenced)}
          referencedColumns: ${JSON.stringify(fk.referenced_columns)}
        }`
      )
      .join(",\n");
    return `${key(table)}: {
      Row: {
${row}
      }
      Insert: {
${insert}
      }
      Update: {
${update}
      }
      Relationships: [${relationships}]
    }`;
  });

  const functionBlocks = functions.map((fn) => {
    const args = fn.args.filter((arg) => arg.mode === "i" || arg.mode === "b");
    const outs = fn.args.filter((arg) => arg.mode === "o" || arg.mode === "t" || arg.mode === "b");
    const argsType = args.length
      ? `{ ${args.map((arg) => `${key(arg.name)}: ${tsType(arg.type)}`).join("; ")} }`
      : "Record<PropertyKey, never>";
    const returnsRow = outs.length
      ? `{ ${outs.map((arg) => `${key(arg.name)}: ${tsType(arg.type)}`).join("; ")} }`
      : fn.returns === "void"
        ? "undefined"
        : tsType(fn.returns);
    return `${key(fn.name)}: {
      Args: ${argsType}
      Returns: ${returnsRow}${fn.returns_set ? "[]" : ""}
    }`;
  });

  return `// Generated by scripts/gen-db-types.mjs from supabase/migrations. Do not edit by hand:
// change a migration, then run \`node scripts/gen-db-types.mjs\` (D-028).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
${tableBlocks.join("\n")}
    }
    Views: { [_ in never]: never }
    Functions: {
${functionBlocks.join("\n")}
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
`;
}

/** The formatted contents src/types/database.ts should have. */
export async function generateDatabaseTypes() {
  const db = await migratedDatabase();
  try {
    const source = render(await readSchema(db));
    const options = (await prettier.resolveConfig(OUTPUT)) ?? {};
    return prettier.format(source, { ...options, filepath: OUTPUT });
  } finally {
    await db.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const generated = await generateDatabaseTypes();
  if (process.argv.includes("--check")) {
    const current = await readFile(OUTPUT, "utf8").catch(() => "");
    if (current !== generated) {
      console.error("src/types/database.ts is out of date: run node scripts/gen-db-types.mjs");
      process.exit(1);
    }
    console.log("src/types/database.ts matches the migrations.");
  } else {
    await writeFile(OUTPUT, generated);
    console.log("Wrote src/types/database.ts");
  }
}
