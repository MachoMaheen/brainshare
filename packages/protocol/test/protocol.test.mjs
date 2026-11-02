import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBrainSharePath, validateProjectManifest, validateSlicesFile } from "../dist/index.js";
test("normalizes portable paths", () => assert.equal(normalizeBrainSharePath("./docs\\api.md"), "docs/api.md"));
test("rejects traversal", () => assert.throws(() => normalizeBrainSharePath("../secret.md")));
test("validates v1 manifests", () => { const m = validateProjectManifest({version:1,project:{name:"x"},notes:{"README.md":{id:"01JQ8Y4B9G0HBRQKCR3T6G9QJ0"}}}); assert.equal(m.project.name, "x"); });
test("validates slice ids", () => assert.throws(() => validateSlicesFile({version:1,slices:{"bad id":{id:"bad id",title:"x",include:["*.md"]}}})));
