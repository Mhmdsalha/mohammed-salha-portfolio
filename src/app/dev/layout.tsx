import "@/app/globals.css";

// Root layout for development-only pages such as /dev/ui (P3-2). The pages set their own
// direction per section; production returns 404 for them.
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
