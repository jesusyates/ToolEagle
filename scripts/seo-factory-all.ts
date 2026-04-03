/**
 * Start EN + ZH SEO factories in parallel (separate processes).
 * Prefix: [EN factory] / [ZH factory]. One exit does not kill the other.
 *
 * Windows: do not spawn npm.cmd with shell:false — batch files EINVAL.
 * Use cmd.exe /d /s /c "npm run <script>" with cwd = repo root.
 */

import { spawn, ChildProcess } from "child_process";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { resolveRepoRoot } = require("./lib/repo-root.js") as {
  resolveRepoRoot: (startDir?: string) => string;
};

const NPM = "npm";
const PREFIX_EN = "[EN factory] ";
const PREFIX_ZH = "[ZH factory] ";

const REPO_ROOT = resolveRepoRoot(path.dirname(fileURLToPath(import.meta.url)));

function pipeWithPrefix(child: ChildProcess, prefix: string, stream: NodeJS.ReadableStream | null, useStderr: boolean) {
  if (!stream) return;
  let buf = "";
  stream.on("data", (chunk: Buffer | string) => {
    buf += chunk.toString();
    const parts = buf.split(/\r?\n/);
    buf = parts.pop() ?? "";
    const out = useStderr ? process.stderr : process.stdout;
    for (const line of parts) {
      if (line.length) out.write(`${prefix}${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buf.length) {
      const out = useStderr ? process.stderr : process.stdout;
      out.write(`${prefix}${buf}\n`);
    }
  });
}

function startPrefixed(prefix: string, npmScript: string) {
  let command: string;
  let args: string[];

  if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/d", "/s", "/c", `npm run ${npmScript}`];
  } else {
    command = NPM;
    args = ["run", npmScript];
  }

  console.log(`${prefix}[spawn] command=${command}`);
  console.log(`${prefix}[spawn] args=${JSON.stringify(args)}`);
  console.log(`${prefix}[spawn] cwd=${REPO_ROOT}`);

  const child = spawn(command, args, {
    cwd: REPO_ROOT,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env
  });

  pipeWithPrefix(child, prefix, child.stdout, false);
  pipeWithPrefix(child, prefix, child.stderr, true);
  child.on("exit", (code, signal) => {
    console.log(`${prefix}[process] exited code=${code ?? "?"} signal=${signal ?? "none"}`);
  });
  return child;
}

async function main() {
  console.log(`[seo-factory-all] starting EN + ZH factories (repo root: ${REPO_ROOT})`);
  startPrefixed(PREFIX_EN, "seo:factory:watch");
  startPrefixed(PREFIX_ZH, "seo:zh:factory:watch");
  await new Promise<void>(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
