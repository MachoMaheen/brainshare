import { describe, expect, it } from "vitest";
import { extractEmbeddedMediaTargets } from "../src/media-extract";

describe("Obsidian media reference discovery", () => {
  it("finds all seven pasted screenshots without requiring image path rewrites", () => {
    const names = [
      "Pasted image 20261106124206.png",
      "Pasted image 20261106124251.png",
      "Pasted image 20261106124312.png",
      "Pasted image 20261106124347.png",
      "Pasted image 20261106124407.png",
      "Pasted image 20261106124429.png",
      "Pasted image 20261106124530.png",
    ];
    const markdown = "# My action ITEMS\n" + names.map(n => `![[${n}]]`).join("\n");
    expect(extractEmbeddedMediaTargets(markdown)).toEqual(names);
  });
  it("supports Obsidian alias/width, relative Markdown files and quoted paths", () => {
    expect(extractEmbeddedMediaTargets(
      '![[screens/diagram.png|400]]\n![alt](<screens/a b.webp>)\n![photo](images/a.jpg "caption")'
    )).toEqual(["screens/diagram.png","screens/a b.webp","images/a.jpg"]);
  });
  it("ignores links to remote images, regular links, and fenced code examples", () => {
    const markdown = [
      "![remote](https://example.com/photo.png)",
      "[local](./source.png)",
      "```md",
      "![[secret.png]]",
      "```",
      "![actual](./published.png)",
    ].join("\n");
    expect(extractEmbeddedMediaTargets(markdown)).toEqual(["./published.png"]);
  });
  it("detects unsupported embeds for a fail-closed preflight instead of silently losing media", () => {
    expect(extractEmbeddedMediaTargets("![[slides.pdf]]\n![[video.mp4]]\n![[unsafe.svg]]"))
      .toEqual(["slides.pdf","video.mp4","unsafe.svg"]);
  });
});
