import test from "node:test";
import assert from "node:assert/strict";
import { parseMarkdown, extractMarkdownLinks, renderMarkdownLite } from "../dist/index.js";
test("parses title/frontmatter",()=>{const d=parseMarkdown("---\ntitle: FM\n---\n# H1\nBody","x");assert.equal(d.title,"H1");assert.equal(d.frontmatter.title,"FM")});
test("extracts wiki and relative markdown links",()=>{const l=extractMarkdownLinks("[[Auth]] and [DB](./db.md#x) and [web](https://x.dev)");assert.deepEqual(l.map(x=>x.kind),["wikilink","markdown"])});
test("does not link code fences",()=>assert.equal(extractMarkdownLinks("```\n[[Nope]]\n```").length,0));
test("viewer renderer escapes html",()=>assert.match(renderMarkdownLite("<script>x</script>"),/&lt;script&gt;/));
