export const CALCULATION_VERSION = "first-order-wave-v1";
export const SCHEMA_VERSION = 1;

export const DEFAULT_STATE = Object.freeze({
  rpm: 12500,
  exOpen: 82,
  temp: 500,
  gamma: 1.33,
  gasConstant: 287,
  headerL: 160,
  headerD: 39.5,
  diff1L: 130,
  diff1D: 65,
  diff2L: 150,
  diff2D: 95,
  diff3L: 170,
  bellyD: 112,
  bellyL: 110,
  baffleL: 220,
  stingerD: 27,
  stingerL: 220,
});

export function buildSegments(input) {
  return [
    { key: "header", name: "Header", length: input.headerL, startDiameter: input.headerD, endDiameter: input.headerD },
    { key: "diffuser-1", name: "Diffuser 1", length: input.diff1L, startDiameter: input.headerD, endDiameter: input.diff1D },
    { key: "diffuser-2", name: "Diffuser 2", length: input.diff2L, startDiameter: input.diff1D, endDiameter: input.diff2D },
    { key: "diffuser-3", name: "Diffuser 3", length: input.diff3L, startDiameter: input.diff2D, endDiameter: input.bellyD },
    { key: "belly", name: "Belly", length: input.bellyL, startDiameter: input.bellyD, endDiameter: input.bellyD },
    { key: "baffle", name: "Baffle", length: input.baffleL, startDiameter: input.bellyD, endDiameter: input.stingerD },
    { key: "stinger", name: "Stinger", length: input.stingerL, startDiameter: input.stingerD, endDiameter: input.stingerD },
  ];
}

export function validateInput(input) {
  const errors = {};
  const positiveFields = [
    "rpm", "gasConstant", "headerL", "headerD", "diff1L", "diff1D", "diff2L", "diff2D",
    "diff3L", "bellyD", "bellyL", "baffleL", "stingerD", "stingerL",
  ];

  for (const key of Object.keys(DEFAULT_STATE)) {
    if (!Number.isFinite(input[key])) errors[key] = "กรุณากรอกเป็นตัวเลข";
  }

  for (const key of positiveFields) {
    if (Number.isFinite(input[key]) && input[key] <= 0) errors[key] = "ค่าต้องมากกว่า 0";
  }

  if (Number.isFinite(input.temp) && input.temp <= -273.15) errors.temp = "ต้องสูงกว่า -273.15 °C";
  if (Number.isFinite(input.gamma) && input.gamma <= 1) errors.gamma = "γ ต้องมากกว่า 1";
  if (Number.isFinite(input.exOpen) && (input.exOpen <= 0 || input.exOpen >= 180)) {
    errors.exOpen = "ต้องอยู่ระหว่าง 0° และ 180° ATDC";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function calculateDesign(input) {
  const validation = validateInput(input);
  if (!validation.valid) return { valid: false, errors: validation.errors };

  const segments = buildSegments(input);
  const overallLengthMm = segments.reduce((sum, segment) => sum + segment.length, 0);
  const reflectionDistanceMm =
    input.headerL + input.diff1L + input.diff2L + input.diff3L + input.bellyL + input.baffleL / 2;
  const acousticSpeedMps = Math.sqrt(input.gamma * input.gasConstant * (input.temp + 273.15));
  const roundTripSeconds = (2 * reflectionDistanceMm) / acousticSpeedMps / 1000;
  const crankTravelDegrees = roundTripSeconds * input.rpm * 6;
  const exhaustDurationDegrees = 360 - 2 * input.exOpen;
  const exhaustClosingAtdc = 360 - input.exOpen;
  const returnArrivalUnwrappedAtdc = input.exOpen + crankTravelDegrees;
  const returnArrivalAtdc = ((returnArrivalUnwrappedAtdc % 360) + 360) % 360;
  const arrivalBeforeClosingDegrees = exhaustClosingAtdc - returnArrivalUnwrappedAtdc;

  return {
    valid: true,
    segments,
    results: {
      overallLengthMm,
      reflectionDistanceMm,
      acousticSpeedMps,
      roundTripSeconds,
      crankTravelDegrees,
      exhaustDurationDegrees,
      exhaustClosingAtdc,
      returnArrivalAtdc,
      returnArrivalUnwrappedAtdc,
      arrivalBeforeClosingDegrees,
    },
  };
}

export function createProjectPayload(input) {
  return {
    schemaVersion: SCHEMA_VERSION,
    calculationVersion: CALCULATION_VERSION,
    program: "OUTLAW 2T PIPE ENGINEERING",
    exportedAt: new Date().toISOString(),
    units: {
      length: "mm",
      temperature: "degC",
      crankAngle: "degATDC",
      speed: "rpm",
    },
    parameters: { ...input },
  };
}

