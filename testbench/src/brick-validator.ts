import { existsSync, readFileSync, readdirSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";

export interface ValidationResult {
  checks: { name: string; ok: boolean; message?: string }[];
  manifest?: any;
}

const KNOWN_ABI_VERSIONS = [
  "legacy.static.v0",
  "legacy.dynamic.v0",
  "nex.brick.v1",
];

const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d]);

export function validateBrick(brickDir: string): ValidationResult {
  const checks: ValidationResult["checks"] = [];
  let manifest: any = undefined;

  // 1. Directory exists
  if (!existsSync(brickDir)) {
    checks.push({ name: "dir_exists", ok: false, message: `Not found: ${brickDir}` });
    return { checks };
  }
  checks.push({ name: "dir_exists", ok: true });

  // 2. manifest.json exists
  const manifestPath = join(brickDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    checks.push({ name: "manifest_exists", ok: false, message: "manifest.json not found" });
    return { checks };
  }
  checks.push({ name: "manifest_exists", ok: true });

  // 3. manifest.json is valid JSON
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (e: any) {
    checks.push({ name: "manifest_valid_json", ok: false, message: e.message });
    return { checks, manifest };
  }
  checks.push({ name: "manifest_valid_json", ok: true });

  // 4. version field
  if (manifest.version && typeof manifest.version === "string") {
    checks.push({ name: "manifest_version", ok: true });
  } else {
    checks.push({ name: "manifest_version", ok: false, message: `Missing or invalid: ${manifest.version}` });
  }

  // 5. abi_version
  if (KNOWN_ABI_VERSIONS.includes(manifest.abi_version)) {
    checks.push({ name: "manifest_abi", ok: true });
  } else {
    checks.push({
      name: "manifest_abi",
      ok: false,
      message: `Unknown abi_version: ${manifest.abi_version}`,
    });
  }

  // 6. bricks array non-empty
  if (Array.isArray(manifest.bricks) && manifest.bricks.length > 0) {
    checks.push({ name: "manifest_bricks", ok: true });
  } else {
    checks.push({ name: "manifest_bricks", ok: false, message: "bricks array empty or missing" });
    return { checks, manifest };
  }

  // 7. entrypoint exists and references a valid brick
  if (manifest.entrypoint) {
    const entryBrick = manifest.bricks.find((b: any) => b.id === manifest.entrypoint);
    if (entryBrick) {
      checks.push({ name: "manifest_entrypoint", ok: true });
    } else {
      checks.push({
        name: "manifest_entrypoint",
        ok: false,
        message: `Entrypoint "${manifest.entrypoint}" not found in bricks`,
      });
    }
  } else {
    checks.push({ name: "manifest_entrypoint", ok: false, message: "No entrypoint field" });
  }

  // 8. All WASM files referenced in bricks exist
  let allWasmOk = true;
  for (const brick of manifest.bricks) {
    const wasmPath = join(brickDir, brick.wasm);
    if (!existsSync(wasmPath)) {
      checks.push({
        name: `wasm_exists:${brick.id}`,
        ok: false,
        message: `Missing: ${brick.wasm}`,
      });
      allWasmOk = false;
    }
  }
  if (allWasmOk) {
    checks.push({ name: "wasm_files_exist", ok: true });
  }

  // 9. WASM magic bytes
  let allMagicOk = true;
  for (const brick of manifest.bricks) {
    const wasmPath = join(brickDir, brick.wasm);
    if (!existsSync(wasmPath)) continue;

    const header = Buffer.alloc(4);
    const fd = openSync(wasmPath, "r");
    readSync(fd, header, 0, 4, 0);
    closeSync(fd);

    if (!header.subarray(0, 4).equals(WASM_MAGIC)) {
      checks.push({
        name: `wasm_magic:${brick.id}`,
        ok: false,
        message: `Invalid WASM magic: ${header.toString("hex")}`,
      });
      allMagicOk = false;
    }
  }
  if (allMagicOk) {
    checks.push({ name: "wasm_magic", ok: true });
  }

  // 10. Globals init files exist (if globals present)
  if (Array.isArray(manifest.globals) && manifest.globals.length > 0) {
    let allGlobalsOk = true;
    for (const g of manifest.globals) {
      if (g.init) {
        const initPath = join(brickDir, g.init);
        if (!existsSync(initPath)) {
          checks.push({
            name: `global_init:${g.name}`,
            ok: false,
            message: `Missing: ${g.init}`,
          });
          allGlobalsOk = false;
        }
      }
    }
    if (allGlobalsOk) {
      checks.push({ name: "globals_exist", ok: true });
    }
  }

  // 11. Each brick has functions array
  let allFuncsOk = true;
  for (const brick of manifest.bricks) {
    if (!Array.isArray(brick.functions)) {
      checks.push({
        name: `brick_functions:${brick.id}`,
        ok: false,
        message: "Missing functions array",
      });
      allFuncsOk = false;
    }
  }
  if (allFuncsOk) {
    checks.push({ name: "brick_functions", ok: true });
  }

  return { checks, manifest };
}
