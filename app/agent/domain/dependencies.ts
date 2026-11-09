export interface InputRef { namespace: string; subject: string; revision: number; sha256: string }
export interface ProofRecord { proofId: string; subject: string; directInputs: readonly InputRef[]; supportProofIds: readonly string[]; ruleFingerprint: string; status: "passed" | "failed" | "skipped" }
export interface ProofFailure { code: "missing_root" | "missing_proof" | "missing_input" | "stale_input" | "stale_rule" | "failed_proof" | "skipped_proof" | "cycle"; id: string; detail: string }
export interface ProofClosureResult { ok: boolean; failures: readonly ProofFailure[]; versionVector: readonly InputRef[]; validProofIds: readonly string[] }

export function inputKey(ref: Pick<InputRef, "namespace" | "subject">): string { return `${ref.namespace}:${ref.subject}`; }
export function evaluateProofClosure(options: { requiredRootProofIds: readonly string[]; proofs: readonly ProofRecord[]; currentInputs: readonly InputRef[]; requiredRuleFingerprints?: Readonly<Record<string, string>> }): ProofClosureResult {
  const proofMap = uniqueMap(options.proofs, (proof) => proof.proofId, "duplicate_proof"), inputMap = uniqueMap(options.currentInputs, inputKey, "duplicate_input"), failures: ProofFailure[] = [], results = new Map<string, boolean>(), visiting = new Set<string>(), vector = new Map<string, InputRef>();
  const visit = (proofId: string, root = false): boolean => {
    if (results.has(proofId)) return results.get(proofId)!;
    const proof = proofMap.get(proofId); if (!proof) { failures.push({ code: root ? "missing_root" : "missing_proof", id: proofId, detail: `${proofId} is absent` }); return false; }
    if (visiting.has(proofId)) { failures.push({ code: "cycle", id: proofId, detail: `${proofId} participates in a proof cycle` }); return false; }
    visiting.add(proofId); let ok = true;
    if (proof.status === "failed") { failures.push({ code: "failed_proof", id: proofId, detail: `${proofId} failed` }); ok = false; }
    if (proof.status === "skipped") { failures.push({ code: "skipped_proof", id: proofId, detail: `${proofId} was skipped` }); ok = false; }
    const requiredRule = options.requiredRuleFingerprints?.[proofId]; if (requiredRule !== undefined && requiredRule !== proof.ruleFingerprint) { failures.push({ code: "stale_rule", id: proofId, detail: `${proofId} rule fingerprint is stale` }); ok = false; }
    for (const expected of proof.directInputs) { const key = inputKey(expected), current = inputMap.get(key); if (!current) { failures.push({ code: "missing_input", id: proofId, detail: `${key} is absent` }); ok = false; } else if (current.revision !== expected.revision || current.sha256 !== expected.sha256) { failures.push({ code: "stale_input", id: proofId, detail: `${key} expected r${expected.revision}/${expected.sha256} but is r${current.revision}/${current.sha256}` }); ok = false; } else vector.set(key, current); }
    for (const supportId of proof.supportProofIds) if (!visit(supportId)) ok = false;
    visiting.delete(proofId); results.set(proofId, ok); return ok;
  };
  const validRoots = options.requiredRootProofIds.filter((root) => visit(root, true));
  return { ok: validRoots.length === options.requiredRootProofIds.length && failures.length === 0, failures, versionVector: [...vector.values()].sort(compareInput), validProofIds: [...results].filter(([, ok]) => ok).map(([id]) => id).sort() };
}

export function invalidatedProofIds(changedInputs: readonly Pick<InputRef, "namespace" | "subject">[], proofs: readonly ProofRecord[]): readonly string[] {
  const reverse = new Map<string, Set<string>>(), invalid = new Set<string>(), queue: string[] = [];
  for (const proof of proofs) { for (const input of proof.directInputs) add(reverse, `input:${inputKey(input)}`, proof.proofId); for (const support of proof.supportProofIds) add(reverse, `proof:${support}`, proof.proofId); }
  for (const input of changedInputs) for (const proofId of reverse.get(`input:${inputKey(input)}`) ?? []) if (!invalid.has(proofId)) { invalid.add(proofId); queue.push(proofId); }
  while (queue.length) { const current = queue.shift()!; for (const dependent of reverse.get(`proof:${current}`) ?? []) if (!invalid.has(dependent)) { invalid.add(dependent); queue.push(dependent); } }
  return [...invalid].sort();
}
function add(map: Map<string, Set<string>>, key: string, value: string): void { const values = map.get(key) ?? new Set<string>(); values.add(value); map.set(key, values); }
function uniqueMap<T>(values: readonly T[], keyOf: (value: T) => string, code: string): Map<string, T> { const result = new Map<string, T>(); for (const value of values) { const key = keyOf(value); if (result.has(key)) throw new Error(code); result.set(key, value); } return result; }
function compareInput(a: InputRef, b: InputRef): number { return inputKey(a).localeCompare(inputKey(b)); }
