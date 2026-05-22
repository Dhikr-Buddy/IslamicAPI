import { spawnSync } from "node:child_process";

const steps = [
  ["node", ["scripts/discover-sources/index.js"]],
  ["node", ["scripts/fetch-datasets/index.js"]],
  ["node", ["scripts/validate-data/index.js"]],
  ["node", ["scripts/normalize-quran/index.js"]],
  ["node", ["scripts/normalize-hadith/index.js"]],
  ["node", ["scripts/normalize-audio/index.js"]],
  ["node", ["scripts/normalize-fonts/index.js"]],
  ["node", ["scripts/build-api-index/index.js"]],
  ["node", ["--test"]]
];

for (const [cmd, args] of steps) run(cmd, args);

const diff = spawnSync("git", ["status", "--short"], { encoding: "utf8" }).stdout.trim();
if (!diff) {
  console.log("No dataset changes detected.");
  process.exit(0);
}

run("git", [
  "add",
  ".github",
  "data",
  "packages",
  "deensdk",
  "src",
  "docs",
  "scripts",
  "tests",
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "pnpm-lock.yaml",
  "pyproject.toml"
]);
const message = chooseCommitMessage(diff);
run("git", ["commit", "-m", message]);
if (process.env.DEEN_AUTO_PUSH === "1") run("git", ["push"]);
console.log(`Committed changes with: ${message}`);

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

function chooseCommitMessage(status) {
  if (status.includes("data/quran")) return "data: sync Quran dataset";
  if (status.includes("data/hadith")) return "data: update hadith corpus";
  if (status.includes("data/audio")) return "fix: normalize audio metadata";
  return "feat: improve prayer calculations";
}
