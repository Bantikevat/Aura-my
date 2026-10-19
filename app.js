/**
 * AETHER - Pure Mathematical Generative Spatial Constellation Engine
 * Zero External Libraries (No Three.js, No Spline, No Frameworks)
 * 100% Pure HTML5 Canvas & Web Audio API Generative Mathematics
 */

(function () {
  'use strict';

  // =========================================================================
  // Vector2 Mathematical Physics Core
  // =========================================================================
  class Vec2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) { this.x = x; this.y = y; return this; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    dist(v) { const dx = this.x - v.x, dy = this.y - v.y; return Math.sqrt(dx * dx + dy * dy); }
    normalize() { const m = this.mag(); if (m !== 0) this.div(m); return this; }
    clone() { return new Vec2(this.x, this.y); }
  }

  // Archetype Color Profiles
  const ARCHETYPES = {
    cyan: { primary: '#00f0ff', secondary: '#0284c7', glow: 'rgba(0, 240, 255, 0.4)', name: 'Singularity' },
    gold: { primary: '#fbbf24', secondary: '#d97706', glow: 'rgba(251, 191, 36, 0.4)', name: 'Solaris' },
    violet: { primary: '#c084fc', secondary: '#7c3aed', glow: 'rgba(192, 132, 252, 0.4)', name: 'Ethereal' },
    rose: { primary: '#f43f5e', secondary: '#be123c', glow: 'rgba(244, 63, 94, 0.4)', name: 'Supernova' }
  };

  // =========================================================================
  // Web Audio Harmonic Synthesizer (432 Hz Tuning)
  // =========================================================================
  class HarmonicAudio {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.droneGain = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.enabled = true;
      this.startSpaceDrone();
    }

    startSpaceDrone() {
      if (!this.enabled || !this.ctx) return;
      // 432 Hz Fundamental Harmonic & Sub-harmonics
      const baseFreq = 108.0; // 432 / 4
      const harmonics = [baseFreq, baseFreq * 1.5, baseFreq * 2, baseFreq * 2.667];

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      this.droneGain.connect(this.ctx.destination);

      harmonics.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(this.droneGain);
        osc.start();
      });
    }

    playCrystalResonance(archetype = 'cyan') {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = archetype === 'gold' ? [432, 540, 648] : [432, 518.4, 648, 864];
      
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);
        gain.gain.setValueAtTime(0.04, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.65);
      });
    }

    playDetonation() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Low bass impact + shimmering high chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);

      // Celestial shimmer
      [864, 1080, 1296, 1728].forEach((f, i) => {
        const hOsc = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        hOsc.type = 'sine';
        hOsc.frequency.setValueAtTime(f, now + 0.1 + i * 0.07);
        hGain.gain.setValueAtTime(0.05, now + 0.1 + i * 0.07);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1 + i * 0.07 + 0.8);
        hOsc.connect(hGain);
        hGain.connect(this.ctx.destination);
        hOsc.start(now + 0.1 + i * 0.07);
        hOsc.stop(now + 0.1 + i * 0.07 + 0.85);
      });
    }

    toggle() {
      if (!this.enabled) {
        this.init();
        return true;
      } else {
        if (this.ctx) this.ctx.suspend();
        this.enabled = false;
        return false;
      }
    }
  }

  const audio = new HarmonicAudio();

  // =========================================================================
  // Generative Mind / Thought Node Class
  // =========================================================================
  class AetherNode {
    constructor(id, title, desc, archetype = 'cyan', mass = 1.0, x, y) {
      this.id = id;
      this.title = title;
      this.desc = desc;
      this.archetype = archetype;
      this.mass = mass;
      this.baseRadius = 26 * mass;
      this.radius = this.baseRadius;
      
      this.pos = new Vec2(x || window.innerWidth / 2, y || window.innerHeight / 2);
      this.vel = new Vec2((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8);
      this.acc = new Vec2(0, 0);

      this.resonance = Math.floor(Math.random() * 40) + 40; // 0 - 100%
      this.phase = Math.random() * Math.PI * 2;
      this.satellites = Math.floor(Math.random() * 3) + 2; // Orbital sub-particles
      this.isHovered = false;
      this.isDragging = false;
    }

    update(time, mode) {
      this.phase += 0.03;
      // Organic breathing radius using harmonic trigonometric waves
      this.radius = this.baseRadius + Math.sin(this.phase) * 3;

      // Gravitational physics modes
      if (mode === 'vortex') {
        const center = new Vec2(window.innerWidth / 2, window.innerHeight / 2);
        const toCenter = center.clone().sub(this.pos);
        const d = Math.max(toCenter.mag(), 50);
        // Tangential angular force + inward gravity
        const tangent = new Vec2(-toCenter.y, toCenter.x).normalize().mult(1.8);
        toCenter.normalize().mult(120 / d);
        this.acc.add(tangent).add(toCenter);
      } else if (mode === 'neural') {
        // High damping, crystalline structure
        this.vel.mult(0.92);
      } else if (mode === 'chaos') {
        // Random micro quantum impulses
        this.acc.add(new Vec2((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
      }

      this.vel.add(this.acc);
      this.vel.mult(0.96); // Drag coefficient
      this.pos.add(this.vel);
      this.acc.set(0, 0);

      // Soft Boundary Reflection
      const pad = this.radius + 40;
      if (this.pos.x < pad) { this.pos.x = pad; this.vel.x *= -0.8; }
      if (this.pos.x > window.innerWidth - pad) { this.pos.x = window.innerWidth - pad; this.vel.x *= -0.8; }
      if (this.pos.y < pad + 60) { this.pos.y = pad + 60; this.vel.y *= -0.8; }
      if (this.pos.y > window.innerHeight - pad - 60) { this.pos.y = window.innerHeight - pad - 60; this.vel.y *= -0.8; }
    }

    draw(ctx, time) {
      const colors = ARCHETYPES[this.archetype] || ARCHETYPES.cyan;

      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);

      // 1. Multi-Layer Volumetric Bioluminescent Glow
      const glowGrad = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius * 2.8);
      glowGrad.addColorStop(0, colors.glow);
      glowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. Quantum Membrane Rings
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner refractive core
      const coreGrad = ctx.createRadialGradient(-this.radius * 0.3, -this.radius * 0.3, 2, 0, 0, this.radius);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, colors.primary);
      coreGrad.addColorStop(1, colors.secondary);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // 3. Orbital Satellites (Sub-task quantum particles)
      for (let i = 0; i < this.satellites; i++) {
        const satAngle = time * (1.5 + i * 0.4) + (i * (Math.PI * 2 / this.satellites));
        const satDist = this.radius + 14 + Math.sin(time * 2 + i) * 4;
        const sx = Math.cos(satAngle) * satDist;
        const sy = Math.sin(satAngle) * satDist;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Node Typography Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.title, 0, this.radius + 22);

      ctx.fillStyle = colors.primary;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText(`${this.resonance}% RESONANCE`, 0, this.radius + 36);

      ctx.restore();
    }
  }

  // =========================================================================
  // Background Cosmic Dust & Starfield System
  // =========================================================================
  class StarfieldDust {
    constructor(count = 140) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 1.8 + 0.4,
          speed: Math.random() * 0.2 + 0.05,
          alpha: Math.random() * 0.6 + 0.2,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    resize(w, h) {
      this.particles.forEach(p => {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
      });
    }

    updateAndDraw(ctx, time) {
      ctx.save();
      this.particles.forEach(p => {
        p.y -= p.speed;
        p.pulse += 0.02;
        if (p.y < 0) p.y = window.innerHeight;

        const dynamicAlpha = p.alpha + Math.sin(p.pulse) * 0.2;
        ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(dynamicAlpha, 0.1)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  // =========================================================================
  // Shockwave Pulse Ring System
  // =========================================================================
  class ShockwaveRing {
    constructor(x, y, color = '#00f0ff') {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.maxRadius = Math.max(window.innerWidth, window.innerHeight) * 0.7;
      this.color = color;
      this.alpha = 0.8;
      this.active = true;
    }

    update() {
      this.radius += 18;
      this.alpha -= 0.018;
      if (this.alpha <= 0) this.active = false;
    }

    draw(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = Math.max(this.alpha, 0);
      ctx.lineWidth = 3;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // =========================================================================
  // Generative Universe Controller & Engine
  // =========================================================================
  let canvas, ctx;
  let nodes = [];
  let starfield;
  let shockwaves = [];
  let activeMode = 'constellation';
  let hoveredNode = null;
  let draggedNode = null;
  let selectedNode = null;

  const mouse = new Vec2(-1000, -1000);
  const dragOffset = new Vec2(0, 0);

  // Initial Presets
  const INITIAL_CONSTELLATIONS = [
    { title: 'Neural Operating System', desc: 'Synthesizing kernel abstractions with zero-latency thread dispatching.', arch: 'cyan', mass: 1.4 },
    { title: 'Autonomous Micro-Agents', desc: 'Self-coordinating spatial agents solving architectural bottlenecks.', arch: 'gold', mass: 1.2 },
    { title: 'Harmonic 432Hz Sound Core', desc: 'Generative wave synthesis aligned to natural frequency mathematics.', arch: 'violet', mass: 1.0 },
    { title: 'Zero-Library Web Canvas', desc: 'Bypassing generic 3D frameworks for direct mathematical GPU memory manipulation.', arch: 'cyan', mass: 1.3 },
    { title: 'Quantum Memory Palace', desc: 'Non-linear spatial thought filing system for deep work focus.', arch: 'rose', mass: 1.1 }
  ];

  function initUniverse() {
    canvas = document.getElementById('generative-canvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    starfield = new StarfieldDust(160);

    // Spawn Initial Living Nodes in an organic spatial orbit
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const spread = Math.min(window.innerWidth, window.innerHeight) * 0.32;

    INITIAL_CONSTELLATIONS.forEach((data, idx) => {
      const angle = (idx / INITIAL_CONSTELLATIONS.length) * Math.PI * 2;
      const x = cx + Math.cos(angle) * spread + (Math.random() - 0.5) * 60;
      const y = cy + Math.sin(angle) * spread + (Math.random() - 0.5) * 60;
      const node = new AetherNode('n-' + idx, data.title, data.desc, data.arch, data.mass, x, y);
      nodes.push(node);
    });

    // Window & Mouse Events
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    initUI();
    renderLoop();
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function onResize() {
    resizeCanvas();
    if (starfield) starfield.resize(window.innerWidth, window.innerHeight);
  }

  // =========================================================================
  // Physics & Particle Math Computations
  // =========================================================================
  function applyInterNodeForces() {
    const maxConnectionDist = 260;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nA = nodes[i];
        const nB = nodes[j];

        const delta = nB.pos.clone().sub(nA.pos);
        const dist = Math.max(delta.mag(), 1);

        if (dist < maxConnectionDist) {
          // Spring Equilibrium Force (Constellation Connection)
          const targetDist = 180 * (nA.mass + nB.mass) * 0.5;
          const forceMag = (dist - targetDist) * 0.0006;
          const force = delta.clone().normalize().mult(forceMag);

          if (!nA.isDragging) nA.acc.add(force);
          if (!nB.isDragging) nB.acc.sub(force);
        }

        // Particle Repulsion (Avoid overlapping)
        const minDist = nA.radius + nB.radius + 30;
        if (dist < minDist) {
          const repelMag = (minDist - dist) * 0.04;
          const repel = delta.clone().normalize().mult(repelMag);
          if (!nA.isDragging) nA.acc.sub(repel);
          if (!nB.isDragging) nB.acc.add(repel);
        }
      }
    }

    // Mouse Magnetic Interaction Lens
    nodes.forEach(node => {
      const dMouse = mouse.dist(node.pos);
      if (dMouse < 180 && !node.isDragging) {
        // Subtle magnetic repulsion with gentle lens curvature
        const repelForce = node.pos.clone().sub(mouse).normalize().mult((180 - dMouse) * 0.08);
        node.acc.add(repelForce);
      }
    });
  }

  // =========================================================================
  // Bioluminescent Synaptic Filaments Drawing
  // =========================================================================
  function drawConstellationFilaments(time) {
    const maxDist = 260;

    ctx.save();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nA = nodes[i];
        const nB = nodes[j];
        const d = nA.pos.dist(nB.pos);

        if (d < maxDist) {
          const alpha = (1 - (d / maxDist)) * 0.7;

          // Vibrating curved bezier string
          const midX = (nA.pos.x + nB.pos.x) / 2;
          const midY = (nA.pos.y + nB.pos.y) / 2;
          // Organic sine wave flex
          const wave = Math.sin(time * 3 + (i * 2 + j)) * 8;
          const ctrlX = midX + wave;
          const ctrlY = midY - wave;

          // Gradient filament between nodes
          const grad = ctx.createLinearGradient(nA.pos.x, nA.pos.y, nB.pos.x, nB.pos.y);
          grad.addColorStop(0, ARCHETYPES[nA.archetype].primary);
          grad.addColorStop(1, ARCHETYPES[nB.archetype].primary);

          ctx.strokeStyle = grad;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(nA.pos.x, nA.pos.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, nB.pos.x, nB.pos.y);
          ctx.stroke();

          // Energy Packet Pulse traveling along the filament
          const packetT = (time * 0.8 + (i * 0.3)) % 1;
          const px = (1 - packetT) * (1 - packetT) * nA.pos.x + 2 * (1 - packetT) * packetT * ctrlX + packetT * packetT * nB.pos.x;
          const py = (1 - packetT) * (1 - packetT) * nA.pos.y + 2 * (1 - packetT) * packetT * ctrlY + packetT * packetT * nB.pos.y;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = ARCHETYPES[nA.archetype].primary;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // Main Mathematical Render Loop (120 FPS capable)
  // =========================================================================
  let clockTime = 0;

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    clockTime += 0.016;

    // 1. Clear with deep void atmospheric fade (leaving ethereal motion trails)
    ctx.fillStyle = 'rgba(3, 5, 11, 0.35)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // 2. Starfield Ethereal Dust
    starfield.updateAndDraw(ctx, clockTime);

    // 3. Shockwave Rings
    shockwaves.forEach(sw => {
      sw.update();
      sw.draw(ctx);
    });
    shockwaves = shockwaves.filter(sw => sw.active);

    // 4. Inter-Node Physics & Gravitational Calculations
    applyInterNodeForces();

    // 5. Synaptic Energy Filaments
    drawConstellationFilaments(clockTime);

    // 6. Draw Living Nodes
    nodes.forEach(node => {
      node.update(clockTime, activeMode);
      node.draw(ctx, clockTime);
    });

    // 7. Update Entropy Metric in Real-Time
    updateLiveMetrics();
  }

  function updateLiveMetrics() {
    const entropyEl = document.getElementById('metric-entropy');
    const nodesEl = document.getElementById('metric-nodes');
    if (entropyEl && Math.random() < 0.05) {
      const e = (0.038 + Math.random() * 0.008).toFixed(3);
      entropyEl.innerText = `${e} λ`;
    }
    if (nodesEl) {
      nodesEl.innerText = `${nodes.length} Active`;
    }
  }

  // =========================================================================
  // Interactive Pointer Events (Dragging & Clicking)
  // =========================================================================
  function onPointerMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (draggedNode) {
      draggedNode.pos.x = mouse.x - dragOffset.x;
      draggedNode.pos.y = mouse.y - dragOffset.y;
      draggedNode.vel.set(0, 0);
      return;
    }

    // Check hover state
    let foundHover = null;
    nodes.forEach(n => {
      if (mouse.dist(n.pos) < n.radius + 10) {
        foundHover = n;
      }
    });

    if (foundHover !== hoveredNode) {
      hoveredNode = foundHover;
      canvas.style.cursor = hoveredNode ? 'grab' : 'crosshair';
    }
  }

  function onPointerDown(e) {
    // Ignore clicks on HUD elements
    if (e.target.closest('.spatial-hud, .bottom-dock, .node-inspector, .creation-modal')) {
      return;
    }

    if (hoveredNode) {
      draggedNode = hoveredNode;
      draggedNode.isDragging = true;
      dragOffset.set(mouse.x - draggedNode.pos.x, mouse.y - draggedNode.pos.y);
      canvas.style.cursor = 'grabbing';
      audio.playCrystalResonance(draggedNode.archetype);
    }
  }

  function onPointerUp(e) {
    if (draggedNode) {
      draggedNode.isDragging = false;
      // If barely moved, treat as inspection click
      if (draggedNode.pos.dist(mouse) < 15 || Math.abs(dragOffset.x) + Math.abs(dragOffset.y) < 10) {
        openNodeInspector(draggedNode);
      }
      draggedNode = null;
      canvas.style.cursor = 'grab';
    }
  }

  // =========================================================================
  // Inspector & UI Modal Controllers
  // =========================================================================
  function openNodeInspector(node) {
    selectedNode = node;
    const card = document.getElementById('node-inspector');
    document.getElementById('inspect-tag').innerText = `${node.archetype.toUpperCase()} SINGULARITY`;
    document.getElementById('inspect-title').innerText = node.title;
    document.getElementById('inspect-desc').innerText = node.desc;
    document.getElementById('inspect-energy-val').innerText = `${node.resonance}%`;
    document.getElementById('inspect-energy-fill').style.width = `${node.resonance}%`;

    card.classList.add('active');
  }

  function closeNodeInspector() {
    document.getElementById('node-inspector').classList.remove('active');
    selectedNode = null;
  }

  function initUI() {
    // Mode Buttons in Bottom Dock
    document.querySelectorAll('.dock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeMode = btn.dataset.mode;
        showToast(`🌌 Mode Switched: ${btn.innerText}`);
        triggerQuantumPulse(window.innerWidth / 2, window.innerHeight / 2);
      });
    });

    // Sound Toggle Button
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const on = audio.toggle();
      if (on) {
        btnSound.classList.add('active');
        btnSound.querySelector('.btn-text').innerText = 'Harmonic: 432Hz ON';
        showToast('✦ 432Hz Harmonic Frequency Active');
      } else {
        btnSound.classList.remove('active');
        btnSound.querySelector('.btn-text').innerText = 'Harmonic Sound';
        showToast('🔇 Audio Muted');
      }
    });

    // Quantum Pulse Shockwave Button
    const btnPulse = document.getElementById('btn-pulse');
    btnPulse.addEventListener('click', () => {
      triggerQuantumPulse(window.innerWidth / 2, window.innerHeight / 2);
      audio.playDetonation();
      showToast('⚡ Gravitational Shockwave Released');
    });

    // Manifest Node (New Node Modal)
    const btnCreate = document.getElementById('btn-create-node');
    const modal = document.getElementById('creation-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');

    btnCreate.addEventListener('click', () => {
      modal.classList.add('active');
      document.getElementById('node-name').focus();
    });

    const closeModal = () => modal.classList.remove('active');
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    // Form Submission
    document.getElementById('creation-form').addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('node-name').value.trim();
      const arch = document.getElementById('node-archetype').value;
      const mass = parseFloat(document.getElementById('node-mass').value);
      const desc = document.getElementById('node-notes').value.trim();

      if (!title) return;

      // Spawn at center with initial burst velocity
      const newNode = new AetherNode(
        'n-' + Date.now(),
        title,
        desc || 'Neural thought wave igniting the constellation web.',
        arch,
        mass,
        window.innerWidth / 2 + (Math.random() - 0.5) * 80,
        window.innerHeight / 2 + (Math.random() - 0.5) * 80
      );
      newNode.vel.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      nodes.push(newNode);

      triggerQuantumPulse(newNode.pos.x, newNode.pos.y, ARCHETYPES[arch].primary);
      audio.playCrystalResonance(arch);
      showToast(`✦ Manifested: "${title}"`);

      closeModal();
      document.getElementById('creation-form').reset();
    });

    // Close Inspector
    document.getElementById('btn-close-inspector').addEventListener('click', closeNodeInspector);

    // Resonate Node Button
    document.getElementById('btn-resonate-node').addEventListener('click', () => {
      if (selectedNode) {
        selectedNode.resonance = Math.min(selectedNode.resonance + 15, 100);
        document.getElementById('inspect-energy-val').innerText = `${selectedNode.resonance}%`;
        document.getElementById('inspect-energy-fill').style.width = `${selectedNode.resonance}%`;
        audio.playCrystalResonance(selectedNode.archetype);
        triggerQuantumPulse(selectedNode.pos.x, selectedNode.pos.y, ARCHETYPES[selectedNode.archetype].primary);
        showToast(`✨ Amplified Resonance: ${selectedNode.resonance}%`);
      }
    });

    // Detonate (Complete) Node Button
    document.getElementById('btn-dissolve-node').addEventListener('click', () => {
      if (selectedNode) {
        const idx = nodes.indexOf(selectedNode);
        if (idx !== -1) {
          triggerQuantumPulse(selectedNode.pos.x, selectedNode.pos.y, '#f43f5e');
          audio.playDetonation();
          showToast(`💥 Singularity Completed & Dissolved!`);
          nodes.splice(idx, 1);
          closeNodeInspector();
        }
      }
    });
  }

  function triggerQuantumPulse(x, y, color = '#00f0ff') {
    shockwaves.push(new ShockwaveRing(x, y, color));
    // Physical repulsive impulse on all nearby nodes
    nodes.forEach(n => {
      const d = n.pos.dist(new Vec2(x, y));
      if (d < 400 && d > 0) {
        const force = n.pos.clone().sub(new Vec2(x, y)).normalize().mult((400 - d) * 0.08);
        n.acc.add(force);
      }
    });
  }

  function showToast(msg) {
    const toast = document.getElementById('aether-toast');
    toast.innerText = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  // Initialize on Window Load
  window.addEventListener('DOMContentLoaded', initUniverse);
})();
