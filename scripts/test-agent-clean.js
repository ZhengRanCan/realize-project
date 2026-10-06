"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist", "agent");
if (!dist.startsWith(path.join(root, "dist") + path.sep)) throw new Error("Unexpected dist target");
fs.rmSync(dist, { recursive: true, force: true });
const node = process.execPath;
execFileSync(node, [path.join(root, "node_modules", "typescript", "bin", "tsc"), "--project", path.join(root, "tsconfig.agent.json")], { cwd: root, stdio: "inherit" });
for (const script of ["test-agent-types.js", "test-agent-registry.js", "test-agent-provider.js", "test-agent-trace.js", "test-agent-core.js"]) execFileSync(node, [path.join(root, "scripts", script)], { cwd: root, stdio: "inherit" });
console.log("agent clean build: passed");

