import { describe, expect, it } from "vitest";
import { getProjectDescription, getProjectTitle } from "@/lib/projects";
import type { Project } from "@/types";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "1",
    slug: "sample",
    title_ar: "مشروع",
    title_en: "Project",
    description_ar: "وصف",
    description_en: "Description",
    category: "webapp",
    tags: [],
    thumbnail_url: null,
    images: [],
    live_url: null,
    github_url: null,
    featured: false,
    featured_order: null,
    order_num: 0,
    label: null,
    highlights_ar: [],
    highlights_en: [],
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides
  };
}

describe("getProjectTitle", () => {
  it("returns the title for the requested locale", () => {
    const project = makeProject();
    expect(getProjectTitle(project, "ar")).toBe("مشروع");
    expect(getProjectTitle(project, "en")).toBe("Project");
  });
});

describe("getProjectDescription", () => {
  it("returns the description for the requested locale", () => {
    const project = makeProject();
    expect(getProjectDescription(project, "ar")).toBe("وصف");
    expect(getProjectDescription(project, "en")).toBe("Description");
  });

  it("falls back to the other locale when one is missing", () => {
    expect(getProjectDescription(makeProject({ description_ar: null }), "ar")).toBe("Description");
    expect(getProjectDescription(makeProject({ description_en: null }), "en")).toBe("وصف");
  });

  it("returns an empty string when both are missing", () => {
    const project = makeProject({ description_ar: null, description_en: null });
    expect(getProjectDescription(project, "ar")).toBe("");
  });
});
