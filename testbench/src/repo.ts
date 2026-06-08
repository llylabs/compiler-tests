import { existsSync } from "node:fs";
import { spawnCapture } from "./utils.js";

interface RepoResult {
  ok: boolean;
  error?: string;
}

export async function ensureRepo(
  url: string,
  targetDir: string,
  sparsePaths?: string[]
): Promise<RepoResult> {
  if (existsSync(targetDir)) {
    // Repo exists — add sparse paths if needed and pull
    if (sparsePaths?.length) {
      await spawnCapture("git", ["sparse-checkout", "add", ...sparsePaths], {
        cwd: targetDir,
        timeout: 30_000,
      });
    }
    const pull = await spawnCapture("git", ["pull", "--ff-only"], {
      cwd: targetDir,
      timeout: 120_000,
    });
    // pull fail is not fatal — repo may just be up to date
    return { ok: true };
  }

  // Clone
  const args = ["clone", "--depth=1"];
  if (sparsePaths?.length) {
    args.push("--sparse", "--filter=blob:none");
  }
  args.push(url, targetDir);

  const clone = await spawnCapture("git", args, { timeout: 300_000 });
  if (clone.code !== 0) {
    return { ok: false, error: `git clone failed: ${clone.stderr.slice(-300)}` };
  }

  if (sparsePaths?.length) {
    const sp = await spawnCapture(
      "git",
      ["sparse-checkout", "set", ...sparsePaths],
      { cwd: targetDir, timeout: 60_000 }
    );
    if (sp.code !== 0) {
      return { ok: false, error: `sparse-checkout failed: ${sp.stderr.slice(-300)}` };
    }
  }

  return { ok: true };
}
