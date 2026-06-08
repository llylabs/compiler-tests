import { spawn } from "child_process"
import type { Runner, SuiteResult, CaseFailure } from "../runner.js"

interface CargoConfig {
  workspace: string
}

interface CargoTestEvent {
  type: string
  event?: string
  name?: string
  exec_time?: number
  stdout?: string
}

function spawnLines(
  cmd: string,
  args: string[],
  cwd: string,
  onLine: (line: string) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    let buf = ""

    proc.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString()
      const lines = buf.split("\n")
      buf = lines.pop() ?? ""
      lines.forEach(onLine)
    })

    proc.on("error", reject)
    proc.on("close", (code) => resolve(code ?? 1))
  })
}

export const runner: Runner = {
  async run(config, _ctx): Promise<SuiteResult> {
    const { workspace } = config as unknown as CargoConfig
    const start = Date.now()
    const id = "cargo-unit"
    const label = "Cargo Unit Tests"

    // ── Step 1: Build ──────────────────────────────────────────────────────
    process.stdout.write("  Building workspace... ")
    const buildCode = await spawnLines("cargo", ["build", "--release"], workspace, () => {})
    if (buildCode !== 0) {
      console.log("✗")
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: "Build failed" }
    }
    console.log("✓")

    // ── Step 2: Test ───────────────────────────────────────────────────────
    process.stdout.write("  Running tests...\n")

    let passed = 0
    let failed = 0
    let skipped = 0
    const failures: CaseFailure[] = []

    await spawnLines("cargo", ["test", "--workspace", "--message-format=json"], workspace, (line) => {
      const trimmed = line.trim()
      if (!trimmed) return

      let event: CargoTestEvent
      try { event = JSON.parse(trimmed) } catch { return }
      if (event.type !== "test") return

      if (event.event === "ok") {
        passed++
      } else if (event.event === "failed") {
        failed++
        failures.push({ name: event.name ?? "unknown", message: (event.stdout ?? "").trim() })
      } else if (event.event === "ignored") {
        skipped++
      }
    })

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
