import { describe, it, expect } from "vitest";
import { parseFrontmatter, extractTitle, renderNote } from "../src/render";

describe("parseFrontmatter", () => {
  it("returns null fm when no frontmatter present", () => {
    const { fm, body } = parseFrontmatter("# just markdown\n\nhi");
    expect(fm).toBeNull();
    expect(body).toBe("# just markdown\n\nhi");
  });

  it("parses scalar fields", () => {
    const { fm, body } = parseFrontmatter("---\ntitle: Hello\nstatus: accepted\n---\n\nbody");
    expect(fm?.byKey.get("title")).toBe("Hello");
    expect(fm?.byKey.get("status")).toBe("accepted");
    expect(body.trimStart()).toBe("body");
  });

  it("parses inline list (tags: [a, b, c])", () => {
    const { fm } = parseFrontmatter("---\ntags: [foo, bar, baz]\n---\n\nx");
    expect(fm?.byKey.get("tags")).toEqual(["foo", "bar", "baz"]);
  });

  it("parses block list with - items", () => {
    const md = "---\naliases:\n  - Home\n  - README\n---\n\nx";
    const { fm } = parseFrontmatter(md);
    expect(fm?.byKey.get("aliases")).toEqual(["Home", "README"]);
  });

  it("strips quotes from scalar values", () => {
    const { fm } = parseFrontmatter("---\ntitle: \"Quoted Title\"\nother: 'single'\n---\n");
    expect(fm?.byKey.get("title")).toBe("Quoted Title");
    expect(fm?.byKey.get("other")).toBe("single");
  });

  it("preserves field insertion order", () => {
    const { fm } = parseFrontmatter("---\na: 1\nb: 2\nc: 3\n---\n");
    expect(fm?.fields.map((f) => f.key)).toEqual(["a", "b", "c"]);
  });
});

describe("extractTitle", () => {
  it("returns the title field", () => {
    expect(extractTitle("---\ntitle: My Note\n---\n\nx")).toBe("My Note");
  });
  it("returns null when no frontmatter", () => {
    expect(extractTitle("# heading only")).toBeNull();
  });
  it("returns null when no title field", () => {
    expect(extractTitle("---\nstatus: x\n---\n")).toBeNull();
  });
});

describe("renderNote", () => {
  it("emits properties panel + breadcrumb + body", () => {
    const md = "---\ntitle: Test\ntags: [foo, bar]\n---\n\n# Heading\n\nBody.\n";
    const html = renderNote(md, "01HX0000000000000000000001", { path: "Notes/Test.md" });
    expect(html).toContain('class="properties"');
    expect(html).toContain('class="breadcrumb"');
    expect(html).toContain("Notes");
    expect(html).toContain('class="chip">foo');
    expect(html).toContain('class="chip">bar');
    expect(html).toContain("<h1>Heading</h1>");
  });

  it("renders wikilinks as private pills in standalone view", () => {
    const md = "---\ntitle: A\n---\n\nlinks to [[Other]] here.\n";
    const html = renderNote(md, "01HX0000000000000000000002");
    expect(html).toContain('class="wikilink-private"');
    expect(html).not.toContain('class="wikilink-internal"');
  });

  it("resolves wikilinks to internal links when target is in share-set", () => {
    const md = "---\ntitle: A\n---\n\nsee [[Other Note]] and [[Missing]].\n";
    const shareSet = new Map([["Other Note", "01HX0000000000000000000099"]]);
    const html = renderNote(md, "01HX0000000000000000000003", {
      shareBase: "https://x.example/share/wrap-id",
      shareSet,
    });
    expect(html).toContain(
      'href="https://x.example/share/wrap-id/01HX0000000000000000000099"'
    );
    expect(html).toContain(">Other Note</a>");
    expect(html).toContain('class="wikilink-private"');
    expect(html).toContain(">Missing</span>");
  });

  it("threads tokenQuery through internal wikilink hrefs", () => {
    const md = "---\ntitle: A\n---\n\n[[Other]]\n";
    const shareSet = new Map([["Other", "01HX0000000000000000000099"]]);
    const html = renderNote(md, "01HX0000000000000000000004", {
      shareBase: "https://x.example/share/wrap-id",
      shareSet,
      tokenQuery: "?t=jwt-here",
    });
    expect(html).toContain(
      'href="https://x.example/share/wrap-id/01HX0000000000000000000099?t=jwt-here"'
    );
  });

  it("renders an Obsidian callout for [!abstract]", () => {
    const md = "---\ntitle: A\n---\n\n> [!abstract] One-line\n> The summary text.\n";
    const html = renderNote(md, "01HX0000000000000000000005");
    expect(html).toContain('data-callout="abstract"');
    expect(html).toContain("One-line");
    expect(html).toContain("The summary text");
  });

  it("renders different callout types with the right data-callout", () => {
    const md = "---\ntitle: A\n---\n\n> [!warning] WARN\n> alert text\n\n> [!todo] todo\n> task\n";
    const html = renderNote(md, "01HX0000000000000000000006");
    expect(html).toContain('data-callout="warning"');
    expect(html).toContain('data-callout="todo"');
  });

  it("respects wikilink alias [[Target|Alias]]", () => {
    const md = "---\ntitle: A\n---\n\n[[Target|displayed text]]\n";
    const html = renderNote(md, "01HX0000000000000000000007");
    expect(html).toContain("displayed text");
    expect(html).not.toContain(">Target<");
  });

  it("scope badges differ between standalone and scoped", () => {
    const md = "---\ntitle: T\n---\n\nbody\n";
    const standalone = renderNote(md, "01HX0000000000000000000008");
    const scoped = renderNote(md, "01HX0000000000000000000008", {
      shareBase: "https://x/share/w",
      shareSet: new Map(),
    });
    expect(standalone).toContain(">standalone<");
    expect(scoped).toContain(">scoped to share<");
  });
});
