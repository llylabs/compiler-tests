import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const SuiteSchema = z.object({
  id: z.string(),
  runner: z.string(),
  label: z.string(),
  nex: z.string().optional(),
  config: z.record(z.unknown()).default({}),
});

const BenchConfigSchema = z.object({
  plugins_dir: z.string(),
  tests_dir: z.string(),
  include_path: z.string().optional(),
  nex: z.string().optional(),
  // Path to the `lly` binary (new pipeline). Falls back to env LLY_BIN or
  // /home/leon/.local/bin/lly. Used by the Next.js suites to invoke
  // `lly nextjs dev` instead of the legacy `nex next dev`.
  lly: z.string().optional(),
  data_dir: z.string().optional(),
  suites: z.array(SuiteSchema).min(1),
});

export type SuiteConfig = z.infer<typeof SuiteSchema>;
export type BenchConfig = z.infer<typeof BenchConfigSchema>;

export function loadConfig(configPath: string): BenchConfig {
  const absPath = resolve(configPath);
  const raw = JSON.parse(readFileSync(absPath, "utf-8"));
  const config = BenchConfigSchema.parse(raw);

  const base = dirname(absPath);
  config.plugins_dir = resolve(base, config.plugins_dir);
  config.tests_dir = resolve(base, config.tests_dir);
  if (config.include_path) {
    config.include_path = resolve(base, config.include_path);
  }
  if (config.data_dir) {
    config.data_dir = resolve(base, config.data_dir);
  }

  return config;
}
