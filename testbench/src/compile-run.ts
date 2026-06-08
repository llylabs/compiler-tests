/**
 * Shared two-step compile+run helper for all test suites.
 * Compiles source via c-compiler/cpp-compiler plugin, then runs via runtime plugin.
 */
import { join, basename, dirname, extname } from "node:path";
import { mkdtempSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnCapture } from "./utils.js";

export interface CompileRunOptions {
  includePaths?: string[];
  timeout?: number;
}

export interface CompileRunResult {
  pass: boolean;
  message?: string;
  stdout?: string;
  exitCode?: number | null;
}

const CPP_EXTS = new Set([".cpp", ".cc", ".cxx", ".C"]);

export function isCpp(file: string): boolean {
  return CPP_EXTS.has(extname(file));
}

/**
 * Compile a source file to a .brick bundle, then run it.
 * Returns stdout and exit code for the caller to judge.
 */
export async function compileAndRun(
  sourceFile: string,
  pluginsDir: string,
  defaultIncludePath: string | undefined,
  opts: CompileRunOptions = {}
): Promise<CompileRunResult> {
  const cpp = isCpp(sourceFile);
  const compiler = join(pluginsDir, cpp ? "cpp-compiler" : "c-compiler");
  const runtime = join(pluginsDir, "runtime");

  if (!existsSync(compiler)) {
    return { pass: false, message: `Compiler not found: ${compiler}` };
  }
  if (!existsSync(runtime)) {
    return { pass: false, message: `Runtime not found: ${runtime}` };
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "lly-cr-"));
  const tmpFile = join(tmpDir, basename(sourceFile));
  const brickDir = join(tmpDir, "out.brick");

  try {
    copyFileSync(sourceFile, tmpFile);

    // Build compile args
    const compileArgs = ["compile", "--source", tmpFile, "--output", brickDir];

    // Add include paths: default + source dir + extras
    const includes: string[] = [];
    if (defaultIncludePath) includes.push(defaultIncludePath);
    includes.push(dirname(sourceFile));
    if (opts.includePaths) includes.push(...opts.includePaths);

    for (const inc of includes) {
      compileArgs.push("--include-path", inc);
    }

    // Compile
    const compile = await spawnCapture(compiler, compileArgs, {
      timeout: opts.timeout || 60_000,
      env: {
        LLY_INTERNAL: "1",
        // Inherit WASI_SDK_PATH and WASI_SYSROOT from host environment.
        // When set, the compiler uses ServerGrade mode (wasm32-wasi + libc++)
        // which enables full STL support (vector, string, iostream, etc.).
        ...(process.env.WASI_SDK_PATH ? { WASI_SDK_PATH: process.env.WASI_SDK_PATH } : {}),
        ...(process.env.WASI_SYSROOT ? { WASI_SYSROOT: process.env.WASI_SYSROOT } : {}),
      },
    });

    if (compile.code !== 0) {
      return {
        pass: false,
        message: compile.stderr.slice(-500),
      };
    }

    // Run
    const run = await spawnCapture(runtime, ["run", brickDir], {
      timeout: opts.timeout || 45_000,
      env: { LLY_INTERNAL: "1" },
    });

    if (run.timedOut) {
      return { pass: false, message: "timeout", stdout: run.stdout, exitCode: null };
    }

    return {
      pass: run.code === 0,
      stdout: run.stdout,
      exitCode: run.code,
      message: run.code !== 0
        ? `exit ${run.code}\n${run.stderr.slice(-200)}`
        : undefined,
    };
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
