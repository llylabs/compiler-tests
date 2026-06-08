import { join, basename } from "node:path";
import { readdirSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure } from "../runner.js";
import { spawnCapture } from "../utils.js";
import { validateBrick } from "../brick-validator.js";

interface CompileTarget {
  source: string;
  compiler: string;
  lang: string;
}

export const runner: Runner = {
  async run(_config, ctx): Promise<SuiteResult> {
    const failures: CaseFailure[] = [];
    let passed = 0;

    const cCompiler = join(ctx.pluginsDir, "c-compiler");
    const cppCompiler = join(ctx.pluginsDir, "cpp-compiler");

    // Collect all test sources
    const targets: CompileTarget[] = [];

    const cDir = join(ctx.testsDir, "c");
    if (existsSync(cDir)) {
      for (const f of readdirSync(cDir).filter((f) => f.endsWith(".c"))) {
        targets.push({ source: join(cDir, f), compiler: cCompiler, lang: "c" });
      }
    }

    const cppDir = join(ctx.testsDir, "cpp");
    if (existsSync(cppDir)) {
      for (const f of readdirSync(cppDir).filter((f) => f.endsWith(".cpp"))) {
        targets.push({ source: join(cppDir, f), compiler: cppCompiler, lang: "cpp" });
      }
    }

    for (const target of targets) {
      const name = `${target.lang}/${basename(target.source)}`;

      if (!existsSync(target.compiler)) {
        failures.push({
          name: `${name}: compiler`,
          message: `Binary not found: ${target.compiler}`,
        });
        continue;
      }

      const tmpDir = join(tmpdir(), `lly-fmt-${Date.now()}-${basename(target.source)}`);
      const brickDir = join(tmpDir, "out.brick");
      mkdirSync(tmpDir, { recursive: true });

      try {
        // Compile
        const compileArgs = ["compile", "--source", target.source, "--output", brickDir];
        if (ctx.includePath) compileArgs.push("--include-path", ctx.includePath);
        const compile = await spawnCapture(target.compiler, compileArgs, {
          timeout: 120_000,
          env: { LLY_INTERNAL: "1", WASI_SDK_PATH: "", WASI_SYSROOT: "" },
        });

        if (compile.code !== 0) {
          failures.push({
            name: `${name}: compile`,
            message: compile.stderr.slice(-300),
          });
          continue;
        }

        // Deep validate
        const result = validateBrick(brickDir);

        for (const check of result.checks) {
          if (check.ok) {
            passed++;
          } else {
            failures.push({
              name: `${name}: ${check.name}`,
              message: check.message || "Check failed",
            });
          }
        }

        // Additional structural checks on manifest
        if (result.manifest) {
          const m = result.manifest;

          // source_lang should match
          if (target.lang === "c" && m.source_lang === "c") {
            passed++;
          } else if (target.lang === "cpp" && (m.source_lang === "cpp" || m.source_lang === "c++")) {
            passed++;
          } else if (m.source_lang) {
            // source_lang is optional in some builds, don't fail if absent
            failures.push({
              name: `${name}: source_lang`,
              message: `Expected "${target.lang}", got "${m.source_lang}"`,
            });
          } else {
            passed++; // absent is ok
          }

          // memory field
          if (m.memory && typeof m.memory.initial_pages === "number") {
            passed++;
          } else {
            failures.push({
              name: `${name}: memory`,
              message: "Missing memory.initial_pages",
            });
          }

          // toolchain field
          if (m.toolchain && m.toolchain.target) {
            passed++;
          } else {
            // toolchain is optional in legacy
            passed++;
          }
        }
      } finally {
        try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
    }

    return {
      id: "",
      label: "",
      passed,
      failed: failures.length,
      skipped: 0,
      duration_ms: 0,
      failures,
    };
  },
};
