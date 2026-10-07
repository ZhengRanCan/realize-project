import path from "node:path";
import { readFile } from "node:fs/promises";
import type { JsonValue } from "../core/protocol";
import type { ArtifactKind } from "../domain/types";
import { DomainWorkspace } from "../domain/workspace";

export async function validateDomainArtifact(repositoryRoot: string, workspace: DomainWorkspace, kind: ArtifactKind, value: JsonValue): Promise<JsonValue> {
  const sourceText = await workspace.readSource(); const coordinates = require(path.join(repositoryRoot, "app", "shared", "source-coordinates.js")) as { parseDocHeadings(text: string): unknown };
  if (kind === "design-review") { const schema = JSON.parse(await readFile(path.join(repositoryRoot, "schema", "design-review.schema.json"), "utf8")) as JsonValue; const schemaValidator = require(path.join(repositoryRoot, "app", "shared", "schema-validator.js")) as { validate(schema: unknown, value: unknown): { valid: boolean; errors: unknown[] } }; const review = require(path.join(repositoryRoot, "app", "shared", "review-model.js")) as { semanticCheck(value: unknown): { errors: unknown[]; warnings: unknown[] } }; const shape = schemaValidator.validate(schema, value), semantic = review.semanticCheck(value); return { status: shape.valid && semantic.errors.length === 0 ? "PASS" : "FAIL", errors: [...shape.errors, ...semantic.errors] as JsonValue[], warnings: semantic.warnings as JsonValue[] }; }
  if (kind === "framework-map") return validator(repositoryRoot, "check-map.js", "checkMap")(value, { docSections: coordinates.parseDocHeadings(sourceText), sourceSha256: workspace.ref.sourceSha256 }) as JsonValue;
  if (kind === "overview-plan") { const design = (await workspace.readCurrent("design-review")).value; return validator(repositoryRoot, "check-plan.js", "checkPlan")(value, { design, sourceSections: coordinates.parseDocHeadings(sourceText), sourceText }) as JsonValue; }
  if (kind === "stage2-block") { const plan = (await workspace.readCurrent("overview-plan")).value; return validator(repositoryRoot, "check-block.js", "checkBlock")(value, plan, { allowedPhrases: [] }) as JsonValue; }
  if (kind === "overview") { const plan = (await workspace.readCurrent("overview-plan")).value; return validator(repositoryRoot, "check-overview.js", "checkOverview")(value, plan, { sourceSections: coordinates.parseDocHeadings(sourceText), sourceText }) as JsonValue; }
  return { status: "not_applicable", errors: [], warnings: [] };
}
function validator(root: string, file: string, name: string): (...args: unknown[]) => unknown { const candidate = (require(path.join(root, "scripts", file)) as Record<string, unknown>)[name]; if (typeof candidate !== "function") throw new Error("validator_unavailable"); return candidate as (...args: unknown[]) => unknown; }
