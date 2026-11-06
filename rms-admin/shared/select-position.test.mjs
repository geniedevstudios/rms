import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("./select-position.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { selectPlacement } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
test("opens upward at a dialog edge even when there is space outside the dialog", () => {
  assert.deepEqual(selectPlacement(180, 470, 390, 432, 132), { above: true, maxHeight: 132 });
});
test("opens down near the top, and constrains tall lists to the larger available space", () => {
  assert.deepEqual(selectPlacement(180, 470, 210, 252, 132), { above: false, maxHeight: 132 });
  assert.deepEqual(selectPlacement(180, 470, 340, 382, 280), { above: true, maxHeight: 146 });
});
