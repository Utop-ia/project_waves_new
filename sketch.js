// ---------------------
// Parametri Principali
// ---------------------
const config = {
  speedPrimary: 30,
  intervalPrimary: 0.3,
  strokePrimary: 80,
  alphaPrimary: 0.8,
  decayFactorPrimary: 1.5,
  heartSizePrimary: 1,
  maxWavesPrimary: 5,

  speedSecondary: 30,
  intervalSecondary: 0.2,
  strokeSecondary: 20,
  alphaSecondary: 0.8,
  decayFactorSecondary: 1.5,
  heartSizeSecondary: 1,
  maxWavesSecondary: 5,

  maxReflections: 2,
  alphaThreshold: 0.005,
  maxSources: 5,
  enableClipping: true,
  saveBackground: true,
  waveDisplayMode: "both",
  zoomSelection: "1",
};

const pal = {
  bg: "#ffffff",
  stroke: "#385a3e",
  stroke2: "#acab6b",
};

const defaultConfig = JSON.parse(JSON.stringify(config));
const defaultPal = JSON.parse(JSON.stringify(pal));

let t = 0;
let paused = false;
let sources = [];
const stats = { fps: 0, sourcesCount: 0, wavesDrawn: 0 };
let maxR;
let waveLayer;
const vectorPool = [];

let isPlayingAnimation = false;
let animationTime = 0;
let currentSequence = [];
let nextEventIndex = 0;

let isRecordingAnimation = false;
let recordingStartTime = 0;
let recordedEvents = [];
let savedAnimationCount = 0;
const userAnimationPresets = {};

const getPooledVector = (x, y) => {
  if (vectorPool.length > 0) {
    const v = vectorPool.pop();
    v.set(x, y);
    return v;
  }
  return createVector(x, y);
};
const returnToPool = (v) => {
  if (vectorPool.length < 500) vectorPool.push(v);
};

// ===================================================================
// PRESET DEGLI STATI DEL BRAND
// ===================================================================
const brandPresets = {
  "Flusso Armonico (Default)": {
    config: {
      speedPrimary: 50,
      intervalPrimary: 0.4,
      strokePrimary: 50,
      alphaPrimary: 0.8,
      decayFactorPrimary: 2.0,
      heartSizePrimary: 1,
      maxWavesPrimary: 3,
      speedSecondary: 50,
      intervalSecondary: 0.4,
      strokeSecondary: 25,
      alphaSecondary: 0.8,
      decayFactorSecondary: 2.0,
      heartSizeSecondary: 1,
      maxWavesSecondary: 3,
      maxReflections: 2,
    },
  },
  "Eco Vitale": {
    config: {
      speedPrimary: 120,
      intervalPrimary: 0.1,
      strokePrimary: 40,
      alphaPrimary: 0.9,
      decayFactorPrimary: 0.8,
      heartSizePrimary: 0.8,
      maxWavesPrimary: 5,
      speedSecondary: 120,
      intervalSecondary: 0.1,
      strokeSecondary: 15,
      alphaSecondary: 0.9,
      decayFactorPrimary: 0.8,
      heartSizeSecondary: 0.8,
      maxWavesSecondary: 5,
      maxReflections: 1,
    },
  },
  "Trama Storica": {
    config: {
      speedPrimary: 20,
      intervalPrimary: 0.8,
      strokePrimary: 60,
      alphaPrimary: 0.4,
      decayFactorPrimary: 3.0,
      heartSizePrimary: 1.2,
      maxWavesPrimary: 10,
      speedSecondary: 20,
      intervalSecondary: 0.8,
      strokeSecondary: 30,
      alphaSecondary: 0.4,
      decayFactorPrimary: 3.0,
      heartSizeSecondary: 1.2,
      maxWavesSecondary: 10,
      maxReflections: 4,
    },
  },
  "Sapore Pieno": {
    config: {
      speedPrimary: 40,
      intervalPrimary: 0.4,
      strokePrimary: 120,
      alphaPrimary: 0.85,
      decayFactorPrimary: 2.5,
      heartSizePrimary: 1.5,
      maxWavesPrimary: 5,
      speedSecondary: 40,
      intervalSecondary: 0.4,
      strokeSecondary: 60,
      alphaSecondary: 0.85,
      decayFactorPrimary: 2.5,
      heartSizeSecondary: 1.5,
      maxWavesSecondary: 5,
      maxReflections: 2,
    },
  },
  "Respiro Calmo": {
    config: {
      speedPrimary: 15,
      intervalPrimary: 1.5,
      strokePrimary: 10,
      alphaPrimary: 0.2,
      decayFactorPrimary: 4.0,
      heartSizePrimary: 1,
      maxWavesPrimary: 5,
      speedSecondary: 15,
      intervalSecondary: 1.5,
      strokeSecondary: 5,
      alphaSecondary: 0.2,
      decayFactorPrimary: 4.0,
      heartSizeSecondary: 1,
      maxWavesSecondary: 5,
      maxReflections: 1,
    },
  },
  "Gesto Creativo": {
    config: {
      speedPrimary: 80,
      intervalPrimary: 0.15,
      strokePrimary: 10,
      alphaPrimary: 0.9,
      decayFactorPrimary: 1.5,
      heartSizePrimary: 0.5,
      maxWavesPrimary: 7,
      speedSecondary: 25,
      intervalSecondary: 0.6,
      strokeSecondary: 90,
      alphaSecondary: 0.7,
      decayFactorSecondary: 2.5,
      heartSizeSecondary: 2,
      maxWavesSecondary: 7,
      maxReflections: 3,
    },
  },
};

// ===================================================================
// DATABASE DELLE ANIMAZIONI
// ===================================================================
const animationPresets = {
  "Battito Umbro (Default)": {
    duration: 8,
    events: [
      {
        time: 0.5,
        x: 0.5,
        y: 0.5,
        override: {
          heartSizePrimary: 1.2,
          speedPrimary: 50,
          strokePrimary: 60,
          maxWavesPrimary: 2,
          heartSizeSecondary: 0.8,
          speedSecondary: 40,
          strokeSecondary: 20,
          maxWavesSecondary: 1,
        },
      },
      {
        time: 1.2,
        x: 0.5,
        y: 0.5,
        override: {
          heartSizePrimary: 0.7,
          speedPrimary: 150,
          strokePrimary: 15,
          maxWavesPrimary: 1,
          waveDisplayMode: "primary",
        },
      },
      {
        time: 4.0,
        x: 0.5,
        y: 0.5,
        override: {
          heartSizePrimary: 1.2,
          speedPrimary: 50,
          strokePrimary: 60,
          maxWavesPrimary: 2,
          heartSizeSecondary: 0.8,
          speedSecondary: 40,
          strokeSecondary: 20,
          maxWavesSecondary: 1,
        },
      },
      {
        time: 4.7,
        x: 0.5,
        y: 0.5,
        override: {
          heartSizePrimary: 0.7,
          speedPrimary: 150,
          strokePrimary: 15,
          maxWavesPrimary: 1,
          waveDisplayMode: "primary",
        },
      },
    ],
  },
  "Centro Pulsante": {
    duration: 3,
    events: [{ time: 0.5, x: 0.5, y: 0.5 }],
  },
  "Pioggia Lenta": {
    duration: 5,
    events: [
      { time: 0.2, x: 0.25, y: 0.2 },
      { time: 0.9, x: 0.7, y: 0.4 },
      { time: 1.5, x: 0.4, y: 0.8 },
      { time: 2.3, x: 0.8, y: 0.7 },
      { time: 3.0, x: 0.15, y: 0.6 },
    ],
  },
  "Onda Orizzontale": {
    duration: 4,
    events: [
      { time: 0.1, x: 0.1, y: 0.5 },
      { time: 0.3, x: 0.2, y: 0.5 },
      { time: 0.5, x: 0.3, y: 0.5 },
      { time: 0.7, x: 0.4, y: 0.5 },
      { time: 0.9, x: 0.5, y: 0.5 },
      { time: 1.1, x: 0.6, y: 0.5 },
      { time: 1.3, x: 0.7, y: 0.5 },
      { time: 1.5, x: 0.8, y: 0.5 },
      { time: 1.7, x: 0.9, y: 0.5 },
    ],
  },
  Fioritura: {
    duration: 6,
    events: [
      { time: 0.1, x: 0.5, y: 0.5 },
      { time: 0.5, x: 0.5, y: 0.3 },
      { time: 0.7, x: 0.7, y: 0.5 },
      { time: 0.9, x: 0.5, y: 0.7 },
      { time: 1.1, x: 0.3, y: 0.5 },
      { time: 1.5, x: 0.78, y: 0.22 },
      { time: 1.7, x: 0.9, y: 0.5 },
      { time: 1.9, x: 0.78, y: 0.78 },
      { time: 2.1, x: 0.5, y: 0.9 },
      { time: 2.3, x: 0.22, y: 0.78 },
      { time: 2.5, x: 0.1, y: 0.5 },
      { time: 2.7, x: 0.22, y: 0.22 },
      { time: 2.9, x: 0.5, y: 0.1 },
    ],
  },
  "Le Colline Umbre": {
    duration: 6,
    events: [
      { time: 0.2, x: 0.2, y: 0.85 },
      { time: 0.5, x: 0.5, y: 0.9 },
      { time: 0.8, x: 0.8, y: 0.8 },
      { time: 1.5, x: 0.35, y: 0.75 },
      { time: 1.9, x: 0.65, y: 0.8 },
    ],
  },
  "Echi dal Borgo": {
    duration: 4,
    events: [
      { time: 0.3, x: 0.2, y: 0.25 },
      { time: 1.0, x: 0.8, y: 0.75 },
    ],
  },
  "Spirale Spirituale": {
    duration: 5,
    events: [
      { time: 0.1, x: 0.5, y: 0.5 },
      { time: 0.4, x: 0.65, y: 0.4 },
      { time: 0.8, x: 0.6, y: 0.65 },
      { time: 1.3, x: 0.35, y: 0.6 },
      { time: 1.9, x: 0.25, y: 0.3 },
      { time: 2.5, x: 0.75, y: 0.25 },
    ],
  },
};

// ===================================================================
// Disegna il cuore
// ===================================================================
function drawHeartShapeUniversal(c, x, y, size) {
  c.push();
  c.translate(x, y);
  c.scale(size / 100.25);
  c.translate(-50.125, -39.795);
  c.noFill();
  c.beginShape();
  c.vertex(64.77, 6.19);
  c.vertex(50.13, 20.83);
  c.vertex(35.49, 6.19);
  c.bezierVertex(27.4, -1.9, 14.29, -1.9, 6.2, 6.19);
  c.bezierVertex(-2.29, 14.28, -2.29, 27.39, 6.2, 35.48);
  c.vertex(20.84, 50.12);
  c.vertex(50.13, 79.41);
  c.vertex(79.42, 50.12);
  c.vertex(94.06, 35.48);
  c.bezierVertex(102.15, 27.39, 102.15, 14.28, 94.06, 6.19);
  c.bezierVertex(85.97, -1.9, 72.86, -1.9, 64.77, 6.19);
  c.endShape(c.CLOSE);
  c.pop();
}

// ===================================================================
// Setup
// ===================================================================
function setup() {
  const canvasContainer = document.getElementById("canvas-container");
  const canvas = createCanvas(
    canvasContainer.clientWidth,
    canvasContainer.clientHeight
  );
  canvas.parent(canvasContainer);

  pixelDensity(1);
  frameRate(60);
  maxR = Math.hypot(width, height);

  waveLayer = createGraphics(width, height);
  waveLayer.noFill();
  waveLayer.strokeCap(SQUARE);

  initializeUI();
  updateUIFromState();
}

// ===================================================================
// Funzione Applica Zoom
// ===================================================================
function applyCanvasZoom() {
  const canvasEl = document.querySelector("#canvas-container canvas");
  if (!canvasEl) return;

  const zoomValue = document.getElementById("zoom-select").value;
  config.zoomSelection = zoomValue;

  if (zoomValue === "fit") {
    const container = document.getElementById("canvas-container");
    const containerW = container.clientWidth - 40;
    const containerH = container.clientHeight - 40;

    const canvasAspectRatio = width / height;
    const containerAspectRatio = containerW / containerH;

    let newWidth, newHeight;

    if (canvasAspectRatio > containerAspectRatio) {
      newWidth = containerW;
      newHeight = containerW / canvasAspectRatio;
    } else {
      newHeight = containerH;
      newWidth = containerH * canvasAspectRatio;
    }

    canvasEl.style.width = newWidth + "px";
    canvasEl.style.height = newHeight + "px";
  } else {
    const zoomFactor = Number(zoomValue);
    canvasEl.style.width = width * zoomFactor + "px";
    canvasEl.style.height = height * zoomFactor + "px";
  }
}

// ===================================================================
// Ciclo draw
// ===================================================================
function draw() {
  const dt = paused ? 0 : deltaTime / 1000;
  t += dt;

  if (isPlayingAnimation && !paused) {
    animationTime += dt;
    if (
      nextEventIndex < currentSequence.events.length &&
      animationTime >= currentSequence.events[nextEventIndex].time
    ) {
      const event = currentSequence.events[nextEventIndex];
      sources.unshift(
        new WaveSource(event.x * width, event.y * height, event.override)
      );
      nextEventIndex++;
    }
    if (animationTime >= currentSequence.duration) {
      isPlayingAnimation = false;
      document.getElementById("play-animation-btn").textContent =
        "Play Animazione Selezionata";
    }
  }

  if (config.saveBackground) waveLayer.background(pal.bg);
  else waveLayer.clear();

  waveLayer.push();
  waveLayer.clip(() => {
    waveLayer.rect(0, 0, width, height);
  });

  stats.wavesDrawn = 0;
  for (let i = sources.length - 1; i >= 0; i--) {
    const src = sources[i];
    src.update(dt);
    stats.wavesDrawn += src.drawWaveLayer(waveLayer);
    if (!src.isAlive()) {
      src.destroy();
      sources.splice(i, 1);
    }
  }

  waveLayer.pop();

  background(pal.bg);
  image(waveLayer, 0, 0);

  if (paused) {
    fill(0, 0, 0, 100);
    noStroke();
    rect(0, 0, width, height);
    fill(255, 255, 255, 200);
    textSize(min(width, height) * 0.1);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    text("PAUSA", width / 2, height / 2);
  }

  updateStats();
}

// ===================================================================
// WaveSource
// ===================================================================
class WaveSource {
  constructor(x, y, override = null) {
    this.pos = getPooledVector(x, y);
    this.t = 0;
    this.imageSources = [];
    this.override = override;
    this.calculateImageSources();
  }

  calculateImageSources() {
    this.imageSources.forEach((s) => returnToPool(s.pos));
    this.imageSources = [];
    const r = this.override?.maxReflections ?? config.maxReflections;
    for (let ix = -r; ix <= r; ix++) {
      for (let iy = -r; iy <= r; iy++) {
        const sx =
          ix % 2 === 0
            ? this.pos.x + ix * width
            : width - this.pos.x + ix * width;
        const sy =
          iy % 2 === 0
            ? this.pos.y + iy * height
            : height - this.pos.y + iy * height;
        this.imageSources.push({
          pos: getPooledVector(sx, sy),
          scaleX: ix % 2 === 0 ? 1 : -1,
          scaleY: iy % 2 === 0 ? 1 : -1,
        });
      }
    }
  }

  update(dt) {
    this.t += dt;
  }

  drawWaveLayer(c) {
    let total = 0;
    const waveDisplayMode =
      this.override?.waveDisplayMode ?? config.waveDisplayMode;

    if (waveDisplayMode === "both" || waveDisplayMode === "primary") {
      total += this.drawWave("primary", c);
    }

    if (waveDisplayMode === "both" || waveDisplayMode === "secondary") {
      total += this.drawWave("secondary", c);
    }

    return total;
  }

  drawWave(type, c) {
    const s = type === "primary" ? "Primary" : "Secondary";
    const o = this.override;

    const speed = o?.["speed" + s] ?? config["speed" + s];
    const interval = o?.["interval" + s] ?? config["interval" + s];
    const strokeW = o?.["stroke" + s] ?? config["stroke" + s];
    const alphaBase = o?.["alpha" + s] ?? config["alpha" + s];
    const color =
      o?.["stroke" + (type === "primary" ? "" : "2")] ??
      pal["stroke" + (type === "primary" ? "" : "2")];
    const decayFactor = o?.["decayFactor" + s] ?? config["decayFactor" + s];
    const heartSize = o?.["heartSize" + s] ?? config["heartSize" + s];
    const maxWaves = o?.["maxWaves" + s] ?? config["maxWaves" + s];

    let wavesDrawn = 0;
    c.strokeWeight(strokeW);
    for (const s of this.imageSources) {
      for (let i = 0; i < maxWaves; i++) {
        const r = speed * (this.t - i * interval);
        if (r < 0 || r > maxR) continue;
        if (!isHeartVisible(s.pos.x, s.pos.y, r * 2 * heartSize)) continue;
        const alpha = calcAlpha(alphaBase, r, maxR, decayFactor);
        if (alpha < config.alphaThreshold) continue;
        const hexAlpha = Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0");
        c.stroke(`${color}${hexAlpha}`);
        c.push();
        c.translate(s.pos.x, s.pos.y);
        c.scale(s.scaleX, s.scaleY);
        drawHeartShapeUniversal(c, 0, 0, r * 2 * heartSize);
        c.pop();
        wavesDrawn++;
      }
    }
    return wavesDrawn;
  }

  isAlive() {
    const maxWaves = Math.max(
      this.override?.maxWavesPrimary ?? config.maxWavesPrimary,
      this.override?.maxWavesSecondary ?? config.maxWavesSecondary
    );
    const interval = Math.max(
      this.override?.intervalPrimary ?? config.intervalPrimary,
      this.override?.intervalSecondary ?? config.intervalSecondary
    );
    const speed = Math.max(
      this.override?.speedPrimary ?? config.speedPrimary,
      this.override?.speedSecondary ?? config.speedSecondary
    );
    const decay = Math.max(
      this.override?.decayFactorPrimary ?? config.decayFactorPrimary,
      this.override?.decayFactorSecondary ?? config.decayFactorSecondary
    );

    const oldestWaveTime = this.t - (maxWaves - 1) * interval;
    if (oldestWaveTime < 0) return true;
    const r_max = speed * oldestWaveTime;
    return calcAlpha(1.0, r_max, maxR, decay) > config.alphaThreshold;
  }

  destroy() {
    this.imageSources.forEach((s) => returnToPool(s.pos));
    this.imageSources = [];
  }
}

// ===================================================================
// Funzioni di supporto
// ===================================================================
function calcAlpha(base, r, maxR, decayFactor) {
  if (r <= 0) return 0;
  const nR = r / maxR;
  if (nR > 1) return 0;
  return base * Math.pow(1 - nR, 2) * Math.exp(-r / (maxR * decayFactor));
}

function isHeartVisible(x, y, size) {
  if (!config.enableClipping) return true;
  const halfSize = size / 2;
  return (
    x + halfSize >= 0 &&
    x - halfSize <= width &&
    y + halfSize >= 0 &&
    y - halfSize <= height
  );
}

// ===================================================================
// GESTIONE UI
// ===================================================================
function initializeUI() {
  document.querySelectorAll(".panel-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.classList.toggle("active");
      const content = header.nextElementSibling;
      content.classList.toggle("show");
    });
  });

  document.querySelectorAll(".slider-group").forEach((group) => {
    const slider = group.querySelector('input[type="range"]');
    const numberInput = group.querySelector('input[type="number"]');
    const key = group.dataset.key;
    const target = group.dataset.target === "config" ? config : pal;
    const step = Number(slider.step);
    const decimals =
      step < 1 ? (step.toString().split(".")[1] || "").length : 0;

    const updateValue = (val) => {
      const numVal = Number(val);
      target[key] = numVal;
      slider.value = numVal;
      numberInput.value = numVal.toFixed(decimals);
    };

    slider.addEventListener("input", () => updateValue(slider.value));
    numberInput.addEventListener("change", () =>
      updateValue(numberInput.value)
    );
  });

  document.querySelectorAll(".color-input-wrapper").forEach((wrapper) => {
    const picker = wrapper.querySelector('input[type="color"]');
    const hexInput = wrapper.querySelector('input[type="text"]');
    const key = picker.dataset.key;

    picker.addEventListener("input", () => {
      pal[key] = picker.value;
      hexInput.value = picker.value;
    });

    hexInput.addEventListener("change", () => {
      let value = hexInput.value;
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        pal[key] = value;
        picker.value = value;
      } else {
        hexInput.value = pal[key];
      }
    });
  });

  document.querySelectorAll(".checkbox-group").forEach((group) => {
    const checkbox = group.querySelector('input[type="checkbox"]');
    const key = group.dataset.key;
    checkbox.addEventListener("change", () => {
      config[key] = checkbox.checked;
    });
  });

  const waveDisplaySelect = document.getElementById("wave-display-select");
  waveDisplaySelect.addEventListener("change", () => {
    config.waveDisplayMode = waveDisplaySelect.value;
  });

  const applyZoomBtn = document.getElementById("apply-zoom-btn");
  applyZoomBtn.addEventListener("click", applyCanvasZoom);

  const presetSelect = document.getElementById("preset-select");
  const applyPresetBtn = document.getElementById("apply-preset-btn");

  for (const name in brandPresets) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    presetSelect.appendChild(option);
  }

  applyPresetBtn.addEventListener("click", () => {
    const presetName = presetSelect.value;
    if (brandPresets[presetName]) {
      const preset = brandPresets[presetName];
      Object.assign(config, JSON.parse(JSON.stringify(preset.config)));
      if (preset.pal) {
        Object.assign(pal, preset.pal);
      }
      updateUIFromState();
    }
  });

  const animPresetSelect = document.getElementById("animation-preset-select");
  const userAnimSelect = document.getElementById("user-animation-select");
  const playAnimBtn = document.getElementById("play-animation-btn");
  const recordAnimBtn = document.getElementById("record-animation-btn");
  const renameAnimBtn = document.getElementById("rename-animation-btn");
  const deleteAnimBtn = document.getElementById("delete-animation-btn");

  function populateAnimationPresets() {
    animPresetSelect.innerHTML = "";
    for (const name in animationPresets) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      animPresetSelect.appendChild(option);
    }
  }
  populateAnimationPresets();

  function populateUserAnimationPresets() {
    const currentVal = userAnimSelect.value;
    userAnimSelect.innerHTML = '<option value="">-- Seleziona --</option>';
    for (const name in userAnimationPresets) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      userAnimSelect.appendChild(option);
    }
    if (userAnimationPresets[currentVal]) {
      userAnimSelect.value = currentVal;
    }
  }
  populateUserAnimationPresets();

  function updateManageButtons() {
    const selectedAnim = userAnimSelect.value;
    const isUserSaved = selectedAnim && userAnimationPresets[selectedAnim];
    renameAnimBtn.disabled = !isUserSaved;
    deleteAnimBtn.disabled = !isUserSaved;
  }

  animPresetSelect.addEventListener("change", () => {
    if (animPresetSelect.value !== "") userAnimSelect.value = "";
    updateManageButtons();
  });
  userAnimSelect.addEventListener("change", () => {
    if (userAnimSelect.value !== "") animPresetSelect.value = "";
    updateManageButtons();
  });
  updateManageButtons();

  playAnimBtn.addEventListener("click", () => {
    const selectedDefault = animPresetSelect.value;
    const selectedUser = userAnimSelect.value;
    if (selectedDefault) playAnimation(selectedDefault);
    if (selectedUser) playAnimation(selectedUser, true);
  });

  recordAnimBtn.addEventListener("click", toggleAnimationRecording);

  renameAnimBtn.addEventListener("click", () => {
    const oldName = userAnimSelect.value;
    const newName = prompt(
      "Inserisci il nuovo nome per l'animazione:",
      oldName
    );

    if (newName && newName.trim() !== "" && newName !== oldName) {
      if (userAnimationPresets[newName] || animationPresets[newName]) {
        alert("Esiste già un'animazione con questo nome.");
        return;
      }
      Object.defineProperty(
        userAnimationPresets,
        newName,
        Object.getOwnPropertyDescriptor(userAnimationPresets, oldName)
      );
      delete userAnimationPresets[oldName];

      populateUserAnimationPresets();
      userAnimSelect.value = newName;
      updateManageButtons();
    }
  });

  deleteAnimBtn.addEventListener("click", () => {
    const animToDelete = userAnimSelect.value;
    if (confirm(`Sei sicuro di voler eliminare "${animToDelete}"?`)) {
      delete userAnimationPresets[animToDelete];
      populateUserAnimationPresets();
      updateManageButtons();
    }
  });

  document
    .getElementById("save-waves-btn")
    .addEventListener("click", saveWaves);
  document.getElementById("pause-btn").addEventListener("click", togglePause);
  document.getElementById("clear-btn").addEventListener("click", clearSources);
  document
    .getElementById("reset-btn")
    .addEventListener("click", resetSimulation);

  const formatSelect = document.getElementById("format-select");
  const customInputs = document.getElementById("custom-format-inputs");
  const applyFormatBtn = document.getElementById("apply-format-btn");
  const customWidthInput = document.getElementById("custom-width");
  const customHeightInput = document.getElementById("custom-height");

  formatSelect.addEventListener("change", () => {
    if (formatSelect.value === "custom")
      customInputs.classList.remove("hidden");
    else customInputs.classList.add("hidden");
  });

  applyFormatBtn.addEventListener("click", () => {
    let newWidth, newHeight;
    const selectedValue = formatSelect.value;
    const canvasContainer = document.getElementById("canvas-container");

    if (selectedValue === "viewport") {
      newWidth = canvasContainer.clientWidth;
      newHeight = canvasContainer.clientHeight;
    } else if (selectedValue === "custom") {
      newWidth = customWidthInput.value;
      newHeight = customHeightInput.value;
    } else {
      [newWidth, newHeight] = selectedValue.split("x");
    }
    resizeCanvasAndContent(newWidth, newHeight);
  });
}

function updateUIFromState() {
  document.querySelectorAll(".slider-group").forEach((group) => {
    const slider = group.querySelector('input[type="range"]');
    const numberInput = group.querySelector('input[type="number"]');
    const key = group.dataset.key;
    const target = group.dataset.target === "config" ? config : pal;
    const val = target[key];

    if (val !== undefined) {
      const step = Number(slider.step);
      const decimals =
        step < 1 ? (step.toString().split(".")[1] || "").length : 0;
      slider.value = val;
      numberInput.value = Number(val).toFixed(decimals);
    }
  });

  document.querySelectorAll(".color-input-wrapper").forEach((wrapper) => {
    const picker = wrapper.querySelector('input[type="color"]');
    const hexInput = wrapper.querySelector('input[type="text"]');
    const key = picker.dataset.key;
    picker.value = pal[key];
    hexInput.value = pal[key];
  });

  document.querySelector(".checkbox-group input").checked =
    config.saveBackground;

  document.getElementById("wave-display-select").value =
    config.waveDisplayMode || "both";

  document.getElementById("zoom-select").value = config.zoomSelection || "1";

  document.getElementById("pause-btn").textContent = paused
    ? "Riprendi"
    : "Pausa";
}

// ===================================================================
// Eventi mouse e tastiera
// ===================================================================
function mousePressed(event) {
  if (isPlayingAnimation) return;
  if (event.target.classList.contains("p5Canvas")) {
    if (isRecordingAnimation) {
      const t = (millis() - recordingStartTime) / 1000;
      recordedEvents.push({ time: t, x: mouseX / width, y: mouseY / height });
      sources.unshift(new WaveSource(mouseX, mouseY));
      return;
    }
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      if (sources.length < config.maxSources)
        sources.unshift(new WaveSource(mouseX, mouseY));
    }
  }
}

function keyPressed() {
  if (document.activeElement.tagName === "INPUT") return;
  if (key === " ") togglePause();
  if (key === "s" || key === "S") saveWaves();
  if (key === "c" || key === "C") clearSources();
  if (key === "r" || key === "R") resetSimulation();
}

// ===================================================================
// Azioni principali
// ===================================================================
function togglePause() {
  paused = !paused;
  updateUIFromState();
}

function clearSources() {
  isPlayingAnimation = false;
  document.getElementById("play-animation-btn").textContent =
    "Play Animazione Selezionata";
  sources.forEach((src) => src.destroy());
  sources = [];
  if (config.saveBackground) waveLayer.background(pal.bg);
  else waveLayer.clear();
}

function resetSimulation() {
  clearSources();
  t = 0;
  paused = false;

  Object.assign(config, defaultConfig);
  Object.assign(pal, defaultPal);

  document.getElementById("format-select").value = "viewport";
  document.getElementById("custom-format-inputs").classList.add("hidden");
  const canvasContainer = document.getElementById("canvas-container");
  resizeCanvasAndContent(
    canvasContainer.clientWidth,
    canvasContainer.clientHeight
  );

  updateUIFromState();
}

function playAnimation(presetName, isUserPreset = false) {
  const preset = isUserPreset
    ? userAnimationPresets[presetName]
    : animationPresets[presetName];
  if (preset) {
    clearSources();
    if (paused) togglePause();

    currentSequence = preset;
    currentSequence.events.sort((a, b) => a.time - b.time);

    animationTime = 0;
    nextEventIndex = 0;
    isPlayingAnimation = true;
    document.getElementById("play-animation-btn").textContent =
      "In Esecuzione...";
  }
}

function toggleAnimationRecording() {
  isRecordingAnimation = !isRecordingAnimation;
  const btn = document.getElementById("record-animation-btn");
  const status = document.getElementById("record-status");
  const userAnimSelect = document.getElementById("user-animation-select");

  if (isRecordingAnimation) {
    clearSources();
    recordedEvents = [];
    recordingStartTime = millis();
    btn.textContent = "Ferma Registrazione";
    btn.classList.add("recording");
    status.textContent = "REC ●";
  } else {
    btn.textContent = "Registra Nuova Animazione";
    btn.classList.remove("recording");
    status.textContent = "";

    if (recordedEvents.length > 0) {
      savedAnimationCount++;
      const newAnimationName = `Animazione Salvata ${savedAnimationCount}`;
      const duration = (millis() - recordingStartTime) / 1000 + 3;

      userAnimationPresets[newAnimationName] = {
        duration: duration,
        events: recordedEvents,
      };

      const option = document.createElement("option");
      option.value = newAnimationName;
      option.textContent = newAnimationName;
      userAnimSelect.appendChild(option);
      userAnimSelect.value = newAnimationName;

      document.getElementById("rename-animation-btn").disabled = false;
      document.getElementById("delete-animation-btn").disabled = false;
    }
  }
}

function resizeCanvasAndContent(w, h) {
  const newWidth = parseInt(w, 10);
  const newHeight = parseInt(h, 10);
  if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
    alert("Per favore, inserisci dimensioni valide.");
    return;
  }
  resizeCanvas(newWidth, newHeight);
  waveLayer.resizeCanvas(newWidth, newHeight);
  maxR = Math.hypot(width, height);
  sources.forEach((src) => src.calculateImageSources());

  applyCanvasZoom();
}

// ===================================================================
// Funzione salvataggio PNG
// ===================================================================
function saveWaves() {
  const tempCanvas = createGraphics(width, height);
  if (config.saveBackground) tempCanvas.background(pal.bg);
  else tempCanvas.clear();

  for (let i = sources.length - 1; i >= 0; i--) {
    const src = sources[i];
    src.drawWaveLayer(tempCanvas);
  }

  tempCanvas.save("onde.png");
  tempCanvas.remove();
}

// ===================================================================
// Resize finestra
// ===================================================================
function windowResized() {
  const canvasContainer = document.getElementById("canvas-container");
  if (document.getElementById("format-select").value === "viewport") {
    resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
    waveLayer.resizeCanvas(width, height);
    maxR = Math.hypot(width, height);
    sources.forEach((src) => src.calculateImageSources());
  }
  applyCanvasZoom();
}

// ===================================================================
// Aggiornamento stats
// ===================================================================
function updateStats() {
  stats.fps = frameRate();
  stats.sourcesCount = sources.length;
  const statsDisplay = document.getElementById("stats-display");
  if (statsDisplay) {
    statsDisplay.children[0].textContent = `FPS: ${stats.fps.toFixed(1)}`;
    statsDisplay.children[1].textContent = `Sorgenti: ${stats.sourcesCount}`;
    statsDisplay.children[2].textContent = `Onde: ${stats.wavesDrawn}`;
  }
}
