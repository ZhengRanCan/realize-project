import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { JsonValue } from "../core/protocol";
import { assertKind, type ArtifactKind, type ArtifactRecord, type ArtifactRef, type DomainWorkspaceRef } from "./types";

const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024;
export class DomainWorkspace {
  constructor(readonly ref: DomainWorkspaceRef) {}
  async readSource(): Promise<string> { return readFile(path.join(this.ref.root, "input", "source.md"), "utf8"); }
  async readRegistry(): Promise<JsonValue> { return readJson(path.join(this.ref.root, "input", "source-registry.json")); }
  async readCurrent(kindValue: string): Promise<{ record: ArtifactRecord; value: JsonValue }> {
    assertKind(kindValue); const record = await readJson(path.join(this.ref.root, "artifacts", kindValue, "current.json")) as unknown as ArtifactRecord;
    for (const dependency of record.dependencies) { const current = await this.#readRecord(dependency.kind); if (current.version !== dependency.version || current.sha256 !== dependency.sha256) throw new Error("stale_dependency"); }
    return { record, value: await readJson(path.join(this.ref.root, record.candidatePath)) };
  }
  async submit(kindValue: string, value: unknown, dependencies: readonly ArtifactRef[] = [], readSet: readonly string[] = [], verdict?: JsonValue): Promise<ArtifactRecord> {
    assertKind(kindValue); const kind: ArtifactKind = kindValue; validateJsonValue(value); const encoded = encode(value);
    for (const dependency of dependencies) { const current = await this.readCurrent(dependency.kind); if (current.record.version !== dependency.version || current.record.sha256 !== dependency.sha256) throw new Error("stale_dependency"); }
    const directory = path.join(this.ref.root, "artifacts", kind); await mkdir(directory, { recursive: true }); const version = await nextVersion(directory); const name = `candidate-${String(version).padStart(6, "0")}.json`; const relative = path.join("artifacts", kind, name).replaceAll("\\", "/"); const candidate = path.join(directory, name);
    await writeFile(candidate, encoded, { encoding: "utf8", flag: "wx" }); const sha256 = createHash("sha256").update(encoded).digest("hex");
    const record: ArtifactRecord = { kind, version, sha256, status: "current", candidatePath: relative, dependencies: structuredClone(dependencies), readSet: [...new Set(readSet)].sort(), ...(verdict === undefined ? {} : { verdict }) };
    const temp = path.join(directory, `.current-${process.pid}-${Date.now()}.tmp`); await writeFile(temp, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); await rename(temp, path.join(directory, "current.json")); await this.#ledger("artifact_committed", record); return record;
  }
  async reject(kindValue: string, value: unknown, dependencies: readonly ArtifactRef[] = [], readSet: readonly string[] = [], verdict?: JsonValue): Promise<ArtifactRecord> { assertKind(kindValue); validateJsonValue(value); const kind: ArtifactKind = kindValue, encoded = encode(value), directory = path.join(this.ref.root, "artifacts", kind); await mkdir(directory, { recursive: true }); const version = await nextVersion(directory), name = `candidate-${String(version).padStart(6, "0")}.json`, relative = path.join("artifacts", kind, name).replaceAll("\\", "/"); await writeFile(path.join(directory, name), encoded, { encoding: "utf8", flag: "wx" }); const record: ArtifactRecord = { kind, version, sha256: createHash("sha256").update(encoded).digest("hex"), status: "rejected", candidatePath: relative, dependencies: structuredClone(dependencies), readSet: [...new Set(readSet)].sort(), ...(verdict === undefined ? {} : { verdict }) }; await this.#ledger("artifact_rejected", record); return record; }
  async #ledger(type: string, record: ArtifactRecord): Promise<void> { await appendFile(path.join(this.ref.root, "ledger", "events.jsonl"), `${JSON.stringify({ type, at: new Date().toISOString(), ...record })}\n`, "utf8"); }
  async #readRecord(kind: ArtifactKind): Promise<ArtifactRecord> { return await readJson(path.join(this.ref.root, "artifacts", kind, "current.json")) as unknown as ArtifactRecord; }
}
async function nextVersion(directory: string): Promise<number> { const names = await readdir(directory); return 1 + names.reduce((max, name) => { const match = /^candidate-(\d{6})\.json$/.exec(name); return match ? Math.max(max, Number(match[1])) : max; }, 0); }
async function readJson(file: string): Promise<JsonValue> { return JSON.parse(await readFile(file, "utf8")) as JsonValue; }
function validateJsonValue(value: unknown): asserts value is JsonValue { try { const text = JSON.stringify(value); if (text === undefined) throw new Error(); JSON.parse(text); } catch { throw new Error("invalid_json_value"); } }
function encode(value: unknown): string { const encoded = `${JSON.stringify(value, null, 2)}\n`; if (Buffer.byteLength(encoded) > MAX_ARTIFACT_BYTES) throw new Error("artifact_capacity_exceeded"); return encoded; }
