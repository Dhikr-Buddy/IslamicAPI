import { spawnSync } from "node:child_process";

const steps = [
  ["node", ["scripts/fetch-datasets/index.js"]],
  ["node", ["scripts/validate-data/index.js"]],
  ["node", ["scripts/normalize-quran/index.js"]],
  ["node", ["scripts/normalize-hadith/index.js"]],
  ["node", ["scripts/normalize-audio/index.js"]],
  ["node", ["scripts/normalize-fonts/index.js"]],
  ["node", ["scripts/build-api-index/index.js"]],
  ["node", ["--test"]]
];

console.log("Starting automatic data generation pipeline...");

for (const [cmd, args] of steps) {
  console.log(`> Running: ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Step failed: ${cmd} ${args.join(" ")}`);
    process.exit(result.status || 1);
  }
}

console.log("Data generation completed successfully. Normalized datasets are saved in /data.");
