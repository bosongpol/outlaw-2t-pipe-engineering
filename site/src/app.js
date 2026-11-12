import {
  DEFAULT_STATE,
  calculateDesign,
  createProjectPayload,
} from "./calculation-core.js";

const fieldGroups = {
  engine: [
    { key: "rpm", label: "Target RPM", unit: "rpm", hint: "รอบกำลังเป้าหมาย", min: 1 },
    { key: "exOpen", label: "Exhaust opening", unit: "°", hint: "องศา ATDC", min: 0, max: 180 },
    { key: "temp", label: "Gas temperature", unit: "°C", hint: "อุณหภูมิเฉลี่ยสมมติ", min: -273.14 },
    { key: "gamma", label: "Heat capacity ratio", unit: "γ", hint: "อัตราส่วนความร้อนจำเพาะ", min: 1.001, step: 0.01 },
    { key: "gasConstant", label: "Gas constant", unit: "J/kg·K", hint: "Specific gas constant", min: 0.01 },
  ],
  geometry: [
    { key: "headerL", label: "Header length", unit: "mm" },
    { key: "headerD", label: "Header diameter", unit: "mm" },
    { key: "diff1L", label: "Diffuser 1 length", unit: "mm" },
    { key: "diff1D", label: "Diffuser 1 end Ø", unit: "mm" },
    { key: "diff2L", label: "Diffuser 2 length", unit: "mm" },
    { key: "diff2D", label: "Diffuser 2 end Ø", unit: "mm" },
    { key: "diff3L", label: "Diffuser 3 length", unit: "mm" },
    { key: "bellyD", label: "Belly Ø", unit: "mm" },
    { key: "bellyL", label: "Belly length", unit: "mm" },
    { key: "baffleL", label: "Baffle length", unit: "mm" },
    { key: "stingerD", label: "Stinger Ø", unit: "mm" },
    { key: "stingerL", label: "Stinger length", unit: "mm" },
  ],
};

let state = { ...DEFAULT_STATE };
const allFields = [...fieldGroups.engine, ...fieldGroups.geometry];
const inputElements = new Map();

function renderFields(containerId, fields) {
  const container = document.getElementById(containerId);
  container.innerHTML = fields.map((field) => `
    <div class="field-row">
      <div class="field-copy">
        <label for="${field.key}">${field.label}</label>
        ${field.hint ? `<span class="field-hint">${field.hint}</span>` : ""}
      </div>
      <div class="input-wrap">
        <input
          id="${field.key}"
          name="${field.key}"
          type="number"
          inputmode="decimal"
          value="${state[field.key]}"
          step="${field.step ?? "any"}"
          ${field.min !== undefined ? `min="${field.min}"` : "min=\"0.01\""}
          ${field.max !== undefined ? `max="${field.max}"` : ""}
          aria-describedby="${field.key}-unit"
        >
        <span id="${field.key}-unit" class="unit">${field.unit}</span>
      </div>
    </div>
  `).join("");

  for (const field of fields) {
    const input = document.getElementById(field.key);
    inputElements.set(field.key, input);
    input.addEventListener("input", () => {
      state[field.key] = input.value.trim() === "" ? Number.NaN : Number(input.value);
      update();
    });
  }
}

function setValidation(errors) {
  const summary = document.getElementById("validation-summary");
  for (const field of allFields) {
    const input = inputElements.get(field.key);
    const message = errors[field.key];
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.title = message ?? "";
  }

  const messages = Object.values(errors);
  summary.hidden = messages.length === 0;
  summary.textContent = messages.length ? `ตรวจสอบข้อมูล: ${[...new Set(messages)].join(" · ")}` : "";
  document.getElementById("export-button").disabled = messages.length > 0;
}

function clearOutput() {
  document.getElementById("pipe-drawing").innerHTML = "";
  document.getElementById("segment-legend").innerHTML = "";
  document.getElementById("segment-rows").innerHTML = "";
  document.getElementById("result-grid").innerHTML = "";
  document.getElementById("overall-length").textContent = "—";
}

function drawPipe(segments) {
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  const maxDiameter = Math.max(...segments.flatMap((segment) => [segment.startDiameter, segment.endDiameter]));
  const points = [{ x: 0, diameter: segments[0].startDiameter }];
  let cursor = 0;

  for (const segment of segments) {
    cursor += segment.length;
    points.push({ x: cursor, diameter: segment.endDiameter });
  }

  const scaleX = (value) => 55 + (890 * value) / total;
  const scaleY = (diameter) => 180 - (diameter * 125) / maxDiameter;
  const upper = points.map((point) => `${scaleX(point.x)},${scaleY(point.diameter)}`).join(" ");
  const lower = [...points].reverse().map((point) => `${scaleX(point.x)},${360 - scaleY(point.diameter)}`).join(" ");

  const boundaries = points.map((point, index) => `
    <line x1="${scaleX(point.x)}" y1="35" x2="${scaleX(point.x)}" y2="325"
      stroke="#536975" stroke-dasharray="4 7" opacity="${index === 0 || index === points.length - 1 ? 0.8 : 0.45}" />
  `).join("");

  document.getElementById("pipe-drawing").innerHTML = `
    <line x1="30" y1="180" x2="970" y2="180" stroke="#536975" stroke-dasharray="8 7" />
    <polygon points="${upper} ${lower}" fill="#ffad32" fill-opacity=".17" stroke="#ffb84d" stroke-width="3" />
    ${boundaries}
  `;

  document.getElementById("segment-legend").innerHTML = segments
    .map((segment) => `<span class="legend-item">${segment.name}</span>`)
    .join("");
}

function renderResults(results) {
  const timingClass = results.arrivalBeforeClosingDegrees < 0 ? "is-warning" : "";
  const resultItems = [
    ["Overall pipe length", `${results.overallLengthMm.toFixed(1)} mm`, ""],
    ["Reflection location", `${results.reflectionDistanceMm.toFixed(1)} mm`, ""],
    ["Acoustic speed", `${results.acousticSpeedMps.toFixed(1)} m/s`, ""],
    ["Round-trip time", `${(results.roundTripSeconds * 1000).toFixed(3)} ms`, ""],
    ["Crank travel", `${results.crankTravelDegrees.toFixed(1)}°`, ""],
    ["Exhaust duration", `${results.exhaustDurationDegrees.toFixed(1)}°`, ""],
    ["Estimated return", `${results.returnArrivalAtdc.toFixed(1)}° ATDC`, timingClass],
    ["Exhaust closing", `${results.exhaustClosingAtdc.toFixed(1)}° ATDC`, ""],
    ["Arrival before closing", `${results.arrivalBeforeClosingDegrees.toFixed(1)}°`, timingClass],
  ];

  document.getElementById("result-grid").innerHTML = resultItems.map(([label, value, className]) => `
    <div class="result-item ${className}">
      <p class="result-label">${label}</p>
      <p class="result-value">${value}</p>
    </div>
  `).join("");
}

function renderSegments(segments) {
  document.getElementById("segment-rows").innerHTML = segments.map((segment) => `
    <tr>
      <td>${segment.name}</td>
      <td>${segment.length.toFixed(1)}</td>
      <td>${segment.startDiameter.toFixed(1)}</td>
      <td>${segment.endDiameter.toFixed(1)}</td>
    </tr>
  `).join("");
}

function update() {
  const calculation = calculateDesign(state);
  setValidation(calculation.errors ?? {});

  if (!calculation.valid) {
    clearOutput();
    return;
  }

  drawPipe(calculation.segments);
  renderResults(calculation.results);
  renderSegments(calculation.segments);
  document.getElementById("overall-length").textContent = `${calculation.results.overallLengthMm.toFixed(1)} mm overall`;
}

function reset() {
  state = { ...DEFAULT_STATE };
  for (const field of allFields) inputElements.get(field.key).value = state[field.key];
  update();
}

function exportProject() {
  const calculation = calculateDesign(state);
  if (!calculation.valid) return;

  const blob = new Blob([JSON.stringify(createProjectPayload(state), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "outlaw-2t-pipe-design.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

renderFields("engine-fields", fieldGroups.engine);
renderFields("geometry-fields", fieldGroups.geometry);
document.getElementById("reset-button").addEventListener("click", reset);
document.getElementById("export-button").addEventListener("click", exportProject);
update();

