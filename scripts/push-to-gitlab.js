import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const tempDir = path.join(os.tmpdir(), `islamicapidata_temp_${Date.now()}`);

console.log("Preparing to push only data to GitLab...");
console.log(`Source data: ${dataDir}`);
console.log(`Temp workspace: ${tempDir}`);

// 1. Create temp directory
fs.mkdirSync(tempDir, { recursive: true });

// 2. Copy data files recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyDir(dataDir, tempDir);

  // 3. Initialize git and push
  const run = (cmd, args, opts = {}) => {
    const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
    if (result.status !== 0) {
      throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
    }
  };

  run("git", ["init"], { cwd: tempDir });
  run("git", ["add", "."], { cwd: tempDir });
  run("git", ["commit", "-m", "sync real datasets"], { cwd: tempDir });
  run("git", ["remote", "add", "origin", "https://gitlab.com/tk8679a/islamicapidata.git"], { cwd: tempDir });
  run("git", ["branch", "-M", "main"], { cwd: tempDir });
  
  console.log("\nPushing to GitLab (this may prompt for credentials)...");
  run("git", ["push", "-uf", "origin", "main"], { cwd: tempDir });

  console.log("\nSuccessfully pushed data to GitLab!");
} catch (error) {
  console.error("\nError during push:", error.message);
  process.exit(1);
} finally {
  // Clean up temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // ignore cleanup errors
  }
}
