import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertRunId, type DomainWorkspaceRef, type RunInputManifest } from "./types";

export interface PrepareRunInputOptions { runId: string; sourcePath: string; runsRoot: string; repositoryRoot: string; signal?: AbortSignal; now?: () => string }
export async function prepareRunInput(options: PrepareRunInputOptions): Promise<DomainWorkspaceRef> {
  assertRunId(options.runId); throwIfAborted(options.signal);
  const root = path.resolve(options.runsRoot, options.runId); const expectedParent = path.resolve(options.runsRoot) + path.sep;
  if (!root.startsWith(expectedParent)) throw new Error("run_path_escape");
  try { await access(root); throw new Error("run_already_exists"); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const temporary = `${root}.preparing-${process.pid}-${Date.now()}`;
  const bytes = await readFile(path.resolve(options.sourcePath)); throwIfAborted(options.signal);
  const sourceText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  const coordinates = loadCoordinates(options.repositoryRoot).buildSourceRegistry(sourceText, { sourcePath: "input/source.md" });
  const manifest: RunInputManifest = { runId: options.runId, sourceName: path.basename(options.sourcePath), sourceSha256, sourceBytes: bytes.length, createdAt: (options.now ?? (() => new Date().toISOString()))() };
  try {
    await mkdir(path.join(temporary, "input"), { recursive: true }); await mkdir(path.join(temporary, "meta"), { recursive: true }); await mkdir(path.join(temporary, "artifacts"), { recursive: true }); await mkdir(path.join(temporary, "ledger"), { recursive: true });
    await writeFile(path.join(temporary, "input", "source.md"), bytes, { flag: "wx" });
    await writeJson(path.join(temporary, "input", "source-registry.json"), coordinates); await writeJson(path.join(temporary, "meta", "run-input.json"), manifest); await writeFile(path.join(temporary, "ledger", "events.jsonl"), "", { flag: "wx" });
    throwIfAborted(options.signal); await mkdir(path.dirname(root), { recursive: true }); await rename(temporary, root);
  } catch (error) { await rm(temporary, { recursive: true, force: true }); throw error; }
  return { runId: options.runId, root, sourceSha256 };
}
function loadCoordinates(repositoryRoot: string): { buildSourceRegistry(text: string, options: { sourcePath: string }): unknown } {
  return require(path.join(path.resolve(repositoryRoot), "app", "shared", "source-coordinates.js")) as { buildSourceRegistry(text: string, options: { sourcePath: string }): unknown };
}
async function writeJson(file: string, value: unknown): Promise<void> { await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); }
function throwIfAborted(signal?: AbortSignal): void { if (signal?.aborted) { const error = new Error("The operation was aborted"); error.name = "AbortError"; throw error; } }
