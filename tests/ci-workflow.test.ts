import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("el CI de pull requests valida calidad, tipos, build, tests y smoketests en orden y aislado", async () => {
  const workflow = await source(".github/workflows/ci.yml");
  const packageJson = JSON.parse(await source("package.json")) as { scripts: Record<string, string> };
  const e2eRunner = await source("scripts/run-e2e-smoke.py");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /postgres:/);
  assert.match(workflow, /postgres:16/);
  assert.match(workflow, /DATABASE_URL: postgresql:\/\/avizor:avizor@localhost:5432\/avizor/);
  assert.match(workflow, /DATABASE_SSL: "false"/);
  assert.doesNotMatch(workflow, /secrets\./i);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /python -m playwright install --with-deps chromium/);
  assert.match(workflow, /RATE_LIMIT_TRUSTED_PROXY: railway/);
  assert.match(workflow, /RATE_LIMIT_HASH_SECRET: ci-only-rate-limit-secret/);

  const commands = ["npm run lint", "npm run typecheck", "npm run build", "npm test", "npm run test:e2e"];
  let previousIndex = -1;
  for (const command of commands) {
    const index = workflow.indexOf(command);
    assert.ok(index > previousIndex, `${command} debe ejecutarse después del paso anterior`);
    previousIndex = index;
  }

  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.test, "tsx --test tests/*.test.ts");
  assert.equal(packageJson.scripts["test:e2e"], "python3 scripts/run-e2e-smoke.py");
  assert.match(e2eRunner, /require_local_database_url/);
  assert.match(e2eRunner, /LOCAL_DATABASE_HOSTS/);
  assert.match(e2eRunner, /127\\\.0\\\.0\\\.1/);
});
