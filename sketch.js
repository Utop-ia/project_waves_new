// ---------------------
// Parametri Principali
// ---------------------
const config = {
  speedPrimary: 30,
  intervalPrimary: 0.3,
  strokePrimary: 80,
  alphaPrimary: 0.8,
  decayFactorPrimary: 1.5,

  speedSecondary: 30,
  intervalSecondary: 0.2,
  strokeSecondary: 20,
  alphaSecondary: 0.8,
  decayFactorSecondary: 1.5,

  maxWaves: 5,
  maxReflections: 2,
  alphaThreshold: 0.005,
  maxSources: 5,
  enableClipping: true,
  saveBackground: true,
  waveDisplayMode: "both",
  zoomSelection: "1",
  heartBaseSize: 1,
};

const pal = {
  bg: "#ffffff",
  stroke: "#34553c",
  stroke2: "#5bd44c",
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
      speedSecondary: 50,
      intervalSecondary: 0.4,
      strokeSecondary: 25,
      alphaSecondary: 0.8,
      decayFactorPrimary: 2.0,
      maxWaves: 3,
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
      speedSecondary: 120,
      intervalSecondary: 0.1,
      strokeSecondary: 15,
      alphaSecondary: 0.9,
      decayFactorPrimary: 0.8,
      maxWaves: 5,
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
      speedSecondary: 20,
      intervalSecondary: 0.8,
      strokeSecondary: 30,
      alphaSecondary: 0.4,
      decayFactorPrimary: 3.0,
      maxWaves: 10,
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
      speedSecondary: 40,
      intervalSecondary: 0.4,
      strokeSecondary: 60,
      alphaSecondary: 0.85,
      decayFactorPrimary: 2.5,
      maxWaves: 5,
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
      speedSecondary: 15,
      intervalSecondary: 1.5,
      strokeSecondary: 5,
      alphaSecondary: 0.2,
      decayFactorPrimary: 4.0,
      maxWaves: 5,
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
      speedSecondary: 25,
      intervalSecondary: 0.6,
      strokeSecondary: 90,
      alphaSecondary: 0.7,
      decayFactorSecondary: 2.5,
      maxWaves: 7,
      maxReflections: 3,
    },
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
// Funzione Applica Zoom (NUOVA LOGICA)
// ===================================================================
function applyCanvasZoom() {
  const canvasEl = document.querySelector("#canvas-container canvas");
  if (!canvasEl) return;

  const zoomValue = document.getElementById("zoom-select").value;
  config.zoomSelection = zoomValue; // Salva la selezione corrente

  if (zoomValue === "fit") {
    const container = document.getElementById("canvas-container");
    const containerW = container.clientWidth - 40; // Sottrae padding
    const containerH = container.clientHeight - 40; // Sottrae padding

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

  // ===================================================================
  // INDICATORE DI PAUSA
  // ===================================================================
  if (paused) {
    //overlay
    fill(0, 0, 0, 100);
    noStroke();
    rect(0, 0, width, height);

    // testo "pausa"
    fill(255, 255, 255, 200);
    textSize(min(width, height) * 0.075);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    text("PAUSA", width / 2, height / 2);
  }

  updateStats();
}

// ===================================================================
// WaveSource con riflessioni speculari corrette
// ===================================================================
class WaveSource {
  constructor(x, y) {
    this.pos = getPooledVector(x, y);
    this.t = 0;
    this.imageSources = [];
    this.calculateImageSources();
  }

  calculateImageSources() {
    this.imageSources.forEach((s) => returnToPool(s.pos));
    this.imageSources = [];
    const r = config.maxReflections;
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

    if (
      config.waveDisplayMode === "both" ||
      config.waveDisplayMode === "primary"
    ) {
      total += this.drawWave(
        this.imageSources,
        config.speedPrimary,
        config.intervalPrimary,
        config.strokePrimary,
        config.alphaPrimary,
        pal.stroke,
        config.decayFactorPrimary,
        c
      );
    }

    if (
      config.waveDisplayMode === "both" ||
      config.waveDisplayMode === "secondary"
    ) {
      total += this.drawWave(
        this.imageSources,
        config.speedSecondary,
        config.intervalSecondary,
        config.strokeSecondary,
        config.alphaSecondary,
        pal.stroke2,
        config.decayFactorSecondary,
        c
      );
    }

    return total;
  }

  drawWave(
    imgSources,
    speed,
    interval,
    strokeW,
    alphaBase,
    color,
    decayFactor,
    c
  ) {
    let wavesDrawn = 0;
    c.strokeWeight(strokeW);
    for (const s of imgSources) {
      for (let i = 0; i < config.maxWaves; i++) {
        const r = speed * (this.t - i * interval);
        if (r < 0 || r > maxR) continue;
        if (!isHeartVisible(s.pos.x, s.pos.y, r * 2 * config.heartBaseSize))
          continue;
        const alpha = calcAlpha(alphaBase, r, maxR, decayFactor);
        if (alpha < config.alphaThreshold) continue;
        const hexAlpha = Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0");
        c.stroke(`${color}${hexAlpha}`);
        c.push();
        c.translate(s.pos.x, s.pos.y);
        c.scale(s.scaleX, s.scaleY);
        drawHeartShapeUniversal(c, 0, 0, r * 2 * config.heartBaseSize);
        c.pop();
        wavesDrawn++;
      }
    }
    return wavesDrawn;
  }

  isAlive() {
    const oldestWaveTime =
      this.t -
      (config.maxWaves - 1) *
        Math.max(config.intervalPrimary, config.intervalSecondary);
    if (oldestWaveTime < 0) return true;
    const r_max =
      Math.max(config.speedPrimary, config.speedSecondary) * oldestWaveTime;
    return (
      calcAlpha(
        1.0,
        r_max,
        maxR,
        Math.max(config.decayFactorPrimary, config.decayFactorSecondary)
      ) > config.alphaThreshold
    );
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

  document.querySelectorAll('input[type="color"]').forEach((picker) => {
    const key = picker.dataset.key;
    picker.addEventListener("input", () => {
      pal[key] = picker.value;
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

  document.querySelectorAll('input[type="color"]').forEach((picker) => {
    picker.value = pal[picker.dataset.key];
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
  if (event.target.classList.contains("p5Canvas")) {
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
