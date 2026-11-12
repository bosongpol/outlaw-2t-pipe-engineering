import test from "node:test";
import assert from "node:assert/strict";
import {
  CALCULATION_VERSION,
  DEFAULT_STATE,
  calculateDesign,
  createProjectPayload,
  validateInput,
} from "../site/src/calculation-core.js";

test("default design reproduces the v0.1 first-order calculation", () => {
  const design = calculateDesign({ ...DEFAULT_STATE });

  assert.equal(design.valid, true);
  assert.equal(design.results.overallLengthMm, 1160);
  assert.equal(design.results.reflectionDistanceMm, 830);
  assert.ok(Math.abs(design.results.acousticSpeedMps - 543.2486415) < 1e-6);
  assert.ok(Math.abs(design.results.returnArrivalUnwrappedAtdc - 311.1768271) < 1e-6);
  assert.ok(Math.abs(design.results.arrivalBeforeClosingDegrees + 33.1768271) < 1e-6);
});

test("invalid inputs do not produce stale calculation output", () => {
  const design = calculateDesign({ ...DEFAULT_STATE, headerL: 0 });

  assert.equal(design.valid, false);
  assert.equal(design.results, undefined);
  assert.equal(design.errors.headerL, "ค่าต้องมากกว่า 0");
});

test("exhaust opening must remain within a physical port-timing range", () => {
  assert.equal(validateInput({ ...DEFAULT_STATE, exOpen: 0 }).valid, false);
  assert.equal(validateInput({ ...DEFAULT_STATE, exOpen: 180 }).valid, false);
  assert.equal(validateInput({ ...DEFAULT_STATE, exOpen: 82 }).valid, true);
});

test("project export contains explicit schema and calculation versions", () => {
  const payload = createProjectPayload({ ...DEFAULT_STATE });

  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.calculationVersion, CALCULATION_VERSION);
  assert.equal(payload.units.length, "mm");
  assert.deepEqual(payload.parameters, DEFAULT_STATE);
});

