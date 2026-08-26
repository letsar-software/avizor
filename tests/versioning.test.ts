import test from "node:test";
import assert from "node:assert/strict";
import { nextVersion } from "../lib/rules/versioning";

test("bumpea el minor manteniendo el major", () => {
  assert.equal(nextVersion("2.0"), "2.1");
  assert.equal(nextVersion("2.9"), "2.10");
  assert.equal(nextVersion("1.3"), "1.4");
});

test("ignora espacios alrededor de la version", () => {
  assert.equal(nextVersion(" 2.0 "), "2.1");
});

test("si no matchea major.minor, anexa .1 en vez de romper", () => {
  assert.equal(nextVersion("v2"), "v2.1");
  assert.equal(nextVersion(""), ".1");
});
