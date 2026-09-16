import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("el CI de pull requests valida calidad, tipos, build, tests y smoketests en orden", async () => {
  const workflow = await source(".github/workflows/ci.yml");
  const packageJson = JSON.parse(await source("package.json")) as { scripts: Record<string, string> };

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /postgres:/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /python -m playwright install --with-deps chromium/);

  const commands = ["npm run lint", "npm run typecheck", "npm run build", "npm test", "npm run test:e2e"];
  let previousIndex = -1;
  for (const command of commands) {
    const index = workflow.indexOf(command);
    assert.ok(index > previousIndex, `${command} debe ejecutarse después del paso anterior`);
    previousIndex = index;
  }

  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts["test:e2e"], "python3 scripts/run-e2e-smoke.py");
});
