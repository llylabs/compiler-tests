import type { BenchConfig, SuiteConfig } from "./config.js";

export interface RunContext {
  pluginsDir: string;
  testsDir: string;
  includePath?: string;
  nexBinary: string;
  /** Path to the `lly` binary (new compiler pipeline). Used by nextjs suites. */
  llyBinary: string;
  dataDir: string;
  cap?: string;
  pathFilter?: string;
}

export interface CaseFailure {
  name: string;
  message: string;
}

export interface SuiteResult {
  id: string;
  label: string;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  failures: CaseFailure[];
  error?: string;
}

export interface Runner {
  run(config: Record<string, unknown>, ctx: RunContext): Promise<SuiteResult>;
}

import { runner as cBrickRunner } from "./suites/c-brick.js";
import { runner as cppBrickRunner } from "./suites/cpp-brick.js";
import { runner as brickFormatRunner } from "./suites/brick-format.js";
import { runner as cTestsuiteRunner } from "./suites/c-testsuite.js";
import { runner as gccTortureRunner } from "./suites/gcc-torture.js";
import { runner as gccDgRunner } from "./suites/gcc-dg.js";
import { runner as gccDgCppRunner } from "./suites/gcc-dg-cpp.js";
import { runner as llvmSingleRunner } from "./suites/llvm-single.js";
import { runner as test262Runner } from "./suites/test262.js";
import { runner as wptRunner } from "./suites/wpt.js";
import { runner as reactSsrRunner } from "./suites/react-ssr.js";
import { runner as nextjsNexRunner } from "./suites/nextjs-nex.js";
import { runner as nextjsE2eRunner } from "./suites/nextjs-e2e.js";
import { runner as nextjsCompatRunner } from "./suites/nextjs-compat.js";
import { runner as httpCompatRunner } from "./suites/http-compat.js";
import { runner as brickSplittingRunner } from "./suites/brick-splitting.js";
import { runner as cargoRunner } from "./suites/cargo.js";
import { runner as chibiccRunner } from "./suites/chibicc.js";
import { runner as csmithRunner } from "./suites/csmith.js";
import { runner as e2eDeployRunner } from "./suites/e2e-deploy.js";
import { runner as emscriptenCoreRunner } from "./suites/emscripten-core.js";
import { runner as muslLibcTestRunner } from "./suites/musl-libc-test.js";
import { runner as nexStdlibRunner } from "./suites/nex-stdlib.js";
import { runner as nativeServerRunner } from "./suites/native-server.js";
import { runner as rustBrickRunner } from "./suites/rust-brick.js";
import { runner as rustRunpassRunner } from "./suites/rust-runpass.js";
import { runner as pthreadRunner } from "./suites/pthread.js";
import { runner as m7Runner } from "./suites/m7.js";
import { runner as goTestdirRunner } from "./suites/go-testdir.js";
import { runner as benchgameRunner } from "./suites/benchgame.js";
import { runner as realworldBuildRunner } from "./suites/realworld-build.js";
import { runner as capHttpRunner } from "./suites/cap-http.js";

const RUNNERS: Record<string, Runner> = {
  "c-brick": cBrickRunner,
  "cpp-brick": cppBrickRunner,
  "brick-format": brickFormatRunner,
  "c-testsuite": cTestsuiteRunner,
  "gcc-torture": gccTortureRunner,
  "gcc-dg": gccDgRunner,
  "gcc-dg-cpp": gccDgCppRunner,
  "llvm-single": llvmSingleRunner,
  "test262": test262Runner,
  "wpt": wptRunner,
  "react-ssr": reactSsrRunner,
  "nextjs-nex": nextjsNexRunner,
  "nextjs-e2e": nextjsE2eRunner,
  "nextjs-compat": nextjsCompatRunner,
  "http-compat": httpCompatRunner,
  "brick-splitting": brickSplittingRunner,
  "cargo": cargoRunner,
  "chibicc": chibiccRunner,
  "csmith": csmithRunner,
  "e2e-deploy": e2eDeployRunner,
  "emscripten-core": emscriptenCoreRunner,
  "musl-libc-test": muslLibcTestRunner,
  "nex-stdlib": nexStdlibRunner,
  "native-server": nativeServerRunner,
  "rust-brick": rustBrickRunner,
  "rust-runpass": rustRunpassRunner,
  "pthread": pthreadRunner,
  "m7": m7Runner,
  "go-testdir": goTestdirRunner,
  "benchgame": benchgameRunner,
  "realworld-build": realworldBuildRunner,
  "cap-http": capHttpRunner,
};

export async function runSuite(
  suite: SuiteConfig,
  ctx: RunContext
): Promise<SuiteResult> {
  const runner = RUNNERS[suite.runner];
  if (!runner) {
    return {
      id: suite.id,
      label: suite.label,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration_ms: 0,
      failures: [],
      error: `Unknown runner: ${suite.runner}`,
    };
  }

  const start = performance.now();
  try {
    const result = await runner.run(suite.config, ctx);
    result.id = suite.id;
    result.label = suite.label;
    result.duration_ms = performance.now() - start;
    return result;
  } catch (err: any) {
    return {
      id: suite.id,
      label: suite.label,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration_ms: performance.now() - start,
      failures: [],
      error: err.message ?? String(err),
    };
  }
}
