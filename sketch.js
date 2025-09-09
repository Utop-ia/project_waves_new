// ---------------------
// Parametri Principali (Configurazione Iniziale)
// ---------------------
const config = {
  waveTypes: [
    {
      name: "primary",
      speed: 50,
      interval: 0.05,
      stroke: 50,
      alpha: 0.7,
      decay: 1,
      colorKey: "stroke",
    },
    {
      name: "secondary",
      speed: 50,
      interval: 0.05,
      stroke: 20,
      alpha: 0.7,
      decay: 1,
      colorKey: "stroke2",
    },
  ],
  maxWaves: 2,
  maxReflections: 2,
  alphaThreshold: 0.005,
  maxSources: 5,
  enableClipping: true,
  saveBackground: true,
};

const pal = {
  bg: "#ffffff",
  stroke: "#34553c",
  stroke2: "#5bd44c",
};

// Salviamo i default per il reset (usando JSON per una copia profonda)
let defaultConfig = JSON.parse(JSON.stringify(config));
let defaultPal = { ...pal };

// ---------------------
// Stato e Metriche
// ---------------------
let t = 0;
let paused = false;
let sources = [];
const stats = { fps: 0, sourcesCount: 0, wavesDrawn: 0 };
let maxR;

// ---------------------
// Pool di Vettori per Ottimizzazione
// ---------------------
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

// ---------------------
// Layer off-screen per onde
// ---------------------
let waveLayer;

// ===================================================================
// FUNZIONE PER DISEGNARE IL CUORE
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
// SETUP E CICLO PRINCIPALE
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

function draw() {
  const dt = paused ? 0 : deltaTime / 1000;
  t += dt;

  if (config.saveBackground) waveLayer.background(pal.bg);
  else waveLayer.clear();

  waveLayer.push();
  waveLayer.clip(() => {
    waveLayer.rect(0, 0, width, height);
  });

  for (let i = sources.length - 1; i >= 0; i--) {
    const src = sources[i];
    src.update(dt);
    src.drawWaveLayer(waveLayer);
    if (!src.isAlive()) {
      src.destroy();
      sources.splice(i, 1);
    }
  }

  waveLayer.pop();

  background(pal.bg);
  image(waveLayer, 0, 0);

  updateStats();
}

function windowResized() {
  const canvasContainer = document.getElementById("canvas-container");
  const formatSelect = document.getElementById("format-select");
  resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);

  maxR = Math.hypot(width, height);

  waveLayer.resizeCanvas(width, height);
  if (config.saveBackground) waveLayer.background(pal.bg);
  else waveLayer.clear();
  formatSelect.value = "viewport";
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
    const step = Number(slider.step);
    const decimals =
      step < 1 ? (step.toString().split(".")[1] || "").length : 0;

    const updateValue = (val) => {
      const numVal = Number(val);
      if (key.includes("Primary")) {
        const prop = key.replace("Primary", "").toLowerCase();
        config.waveTypes[0][prop] = numVal;
      } else if (key.includes("Secondary")) {
        const prop = key.replace("Secondary", "").toLowerCase();
        config.waveTypes[1][prop] = numVal;
      } else {
        config[key] = numVal;
      }
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

  // --- GESTIONE PRESET ---
  const presetSelect = document.getElementById("preset-select");
  if (presetSelect) {
    // Controlla se l'elemento esiste
    const savePresetBtn = document.getElementById("save-preset-btn");
    const loadPresetBtn = document.getElementById("load-preset-btn");
    const deletePresetBtn = document.getElementById("delete-preset-btn");

    function updatePresetList() {
      presetSelect.innerHTML =
        '<option value="">Seleziona un preset...</option>';
      const presets = JSON.parse(localStorage.getItem("wavePresets")) || {};
      for (const name in presets) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        presetSelect.appendChild(option);
      }
    }

    savePresetBtn.addEventListener("click", () => {
      const name = prompt("Inserisci un nome per il preset:");
      if (name) {
        const presets = JSON.parse(localStorage.getItem("wavePresets")) || {};
        presets[name] = {
          config: JSON.parse(JSON.stringify(config)),
          pal: { ...pal },
        };
        localStorage.setItem("wavePresets", JSON.stringify(presets));
        updatePresetList();
      }
    });

    loadPresetBtn.addEventListener("click", () => {
      const name = presetSelect.value;
      if (name) {
        const presets = JSON.parse(localStorage.getItem("wavePresets")) || {};
        if (presets[name]) {
          Object.assign(config, presets[name].config);
          Object.assign(pal, presets[name].pal);
          updateUIFromState();
        }
      }
    });

    deletePresetBtn.addEventListener("click", () => {
      const name = presetSelect.value;
      if (
        name &&
        confirm(`Sei sicuro di voler eliminare il preset "${name}"?`)
      ) {
        const presets = JSON.parse(localStorage.getItem("wavePresets")) || {};
        delete presets[name];
        localStorage.setItem("wavePresets", JSON.stringify(presets));
        updatePresetList();
      }
    });

    updatePresetList();
  }

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
    let val;

    if (key.includes("Primary")) {
      const prop = key.replace("Primary", "").toLowerCase();
      val = config.waveTypes[0][prop];
    } else if (key.includes("Secondary")) {
      const prop = key.replace("Secondary", "").toLowerCase();
      val = config.waveTypes[1][prop];
    } else {
      val = config[key];
    }

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
  document.getElementById("pause-btn").textContent = paused
    ? "Riprendi"
    : "Pausa";
}

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

// ===================================================================
// GESTIONE EVENTI
// ===================================================================
function mousePressed(event) {
  const sidebar = document.getElementById("ui-sidebar");
  if (event.target.closest("#ui-sidebar")) return;
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    if (sources.length < config.maxSources)
      sources.unshift(new WaveSource(mouseX, mouseY));
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
// AZIONI PRINCIPALI
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

  config.waveTypes = JSON.parse(JSON.stringify(defaultConfig.waveTypes));
  Object.assign(config, defaultConfig);
  Object.assign(pal, defaultPal);

  if (config.saveBackground) waveLayer.background(pal.bg);
  else waveLayer.clear();
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
  if (config.saveBackground) waveLayer.background(pal.bg);
  else waveLayer.clear();
  clearSources();
}

// ===================================================================
// FUNZIONE SALVATAGGIO PNG
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
// CLASSE WaveSource
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
    let wavesDrawn = 0;
    for (const wave of config.waveTypes) {
      wavesDrawn += this.drawSingleWaveType(wave, c);
    }
    return wavesDrawn;
  }

  drawSingleWaveType(wave, c) {
    let wavesDrawn = 0;
    c.strokeWeight(wave.stroke);
    for (const s of this.imageSources) {
      for (let i = 0; i < config.maxWaves; i++) {
        const r = wave.speed * (this.t - i * wave.interval);
        if (r < 0 || r > maxR) continue;
        if (!isCircleVisible(s.pos.x, s.pos.y, r)) continue;

        const alpha = calcAlpha(wave.alpha, r, maxR, wave.decay);
        if (alpha < config.alphaThreshold) continue;

        const hexAlpha = Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0");
        c.stroke(`${pal[wave.colorKey]}${hexAlpha}`);

        c.push();
        c.translate(s.pos.x, s.pos.y);
        c.scale(s.scaleX, s.scaleY);
        drawHeartShapeUniversal(c, 0, 0, r * 2);
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
        Math.max(...config.waveTypes.map((w) => w.interval));
    if (oldestWaveTime < 0) return true;

    const r_max =
      Math.max(...config.waveTypes.map((w) => w.speed)) * oldestWaveTime;
    const decay_max = Math.max(...config.waveTypes.map((w) => w.decay));

    return calcAlpha(1.0, r_max, maxR, decay_max) > config.alphaThreshold;
  }

  destroy() {
    this.imageSources.forEach((s) => returnToPool(s.pos));
    this.imageSources = [];
  }
}

// ===================================================================
// FUNZIONI AUSILIARIE
// ===================================================================
function calcAlpha(base, r, maxR, decayFactor) {
  if (r <= 0) return 0;
  const nR = r / maxR;
  if (nR > 1) return 0;
  return base * Math.pow(1 - nR, 2) * Math.exp(-r / (maxR * decayFactor));
}

function isCircleVisible(x, y, r) {
  if (!config.enableClipping) return true;
  return x + r >= 0 && x - r <= width && y + r >= 0 && y - r <= height;
}
