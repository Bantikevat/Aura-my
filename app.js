/**
 * OMNILAB 3D - Interactive Science & Physics Simulation Engine
 * Real-time 3D Three.js Laboratory for Fundamental Physics & IIT Concepts
 * 1. Gravity & Planetary Orbits (Kepler & Newton)
 * 2. Quantum Bohr Atom (Electron Energy Shells & Photon Emission)
 * 3. Optical Prism Light Dispersion (Snell's Law & Cauchy Wavelengths)
 */

(function () {
  'use strict';

  // =========================================================================
  // Scientific Concept Data Models (IIT & First-Principles)
  // =========================================================================
  const EXPERIMENT_DATA = {
    gravity: {
      tag: 'GRAVITATIONAL MECHANICS',
      title: 'Planetary Orbits & General Relativity',
      formula: 'F = G (m₁ m₂) / r²',
      desc: "Newton's Universal Gravitation Law: Every particle attracts every other particle with a force proportional to the product of their masses and inversely proportional to the square of the distance.",
      feynman: "Suraj ek vishal baraf ki trampoline par rakhi bhari ball jaisa hai jo chaaron taraf gadda bana deta hai. Planets us gadde mein girne ki koshish karte hain, lekin unki aage badhne ki speed unhe gol-gol ghumati rehti hai!",
      impact: "ISRO & NASA is law ka use gravitational slingshot karke Mangalyaan aur Voyager spacecrafts ko bina fuel ke doosre planets tak phenkne ke liye karte hain."
    },
    atom: {
      tag: 'QUANTUM MECHANICS',
      title: 'Bohr Atomic Model & Quantum Leaps',
      formula: 'ΔE = h ν = hc / λ',
      desc: "Bohr's Postulate: Electrons only orbit in quantized non-radiating shells. When an electron jumps to a lower shell, it emits a single photon of light with energy equal to the difference.",
      feynman: "Electron kisi building ki seedhiyon jaisa hai: aap seedhi 1 ya seedhi 2 par khade ho sakte ho, lekin hawa mein do seedhiyon ke beech nahi reh sakte! Jab electron neeche koodta hai, toh roshni (photon) ka jhatka nikalta hai.",
      impact: "IIT & Modern Physics: Lasers, LEDs, aur Quantum Computing isi principle par kaam karte hain. Fireworks (patakho) ka rang bhi alag-alag atom ke electron jump se banta hai!"
    },
    prism: {
      tag: 'WAVE OPTICS',
      title: "Snell's Law & Light Dispersion",
      formula: 'n₁ sin(θ₁) = n₂ sin(θ₂)',
      desc: "Snell's Law & Cauchy's Dispersion: Glass ka refractive index wavelength par depend karta hai. Violet light sabse zyada bend hoti hai aur Red light sabse kam, jisse White light 7 rangon mein bat jaati hai.",
      feynman: "White light 7 alag-alag bachhon ki team jaisi hai jo haath pakad ke daud rahe hain. Jaise hi woh kanch (glass) ke keechad mein ghuste hain, Violet bachha zyada slow ho jata hai aur Red tezi se nikal jata hai, jisse saare rang alag dikhte hain!",
      impact: "IIT Optics: Rainbow banna, Fiber Optic internet cables, aur Space Telescopes (James Webb) isi se taaron ki chemical composition pata lagate hain."
    }
  };

  // =========================================================================
  // Web Audio Scientific Synthesizer
  // =========================================================================
  class LabAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playQuantumChime(freq = 656) {
      if (!this.enabled) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.3);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    }

    playGravityHum() {
      if (!this.enabled) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  }

  const audio = new LabAudio();

  // =========================================================================
  // Global Simulation State & Three.js Viewport
  // =========================================================================
  let scene, camera, renderer, controls;
  let activeExperiment = 'gravity';

  // Sub-groups for active experiment
  let gravityGroup = new THREE.Group();
  let atomGroup = new THREE.Group();
  let prismGroup = new THREE.Group();

  function initThree() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 200);
    camera.position.set(0, 30, 42);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 120;
    controls.target.set(0, 0, 0);

    // Global Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    scene.add(gravityGroup);
    scene.add(atomGroup);
    scene.add(prismGroup);

    // Initialize the 3 simulations
    buildGravitySim();
    buildAtomSim();
    buildPrismSim();

    switchExperiment('gravity');

    window.addEventListener('resize', onResize);
    animate();
  }

  // =========================================================================
  // SIMULATION 1: GRAVITY & PLANETARY ORBITS
  // =========================================================================
  let sunMesh, sunGlow;
  let planets = [];
  let gConstant = 1.0;
  let sunMass = 1000;
  let simSpeed = 1.0;

  function buildGravitySim() {
    // 1. Central Glowing Sun
    const sunGeo = new THREE.SphereGeometry(3.0, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    gravityGroup.add(sunMesh);

    // Sun Corona Glow
    const glowGeo = new THREE.SphereGeometry(3.8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    sunGlow = new THREE.Mesh(glowGeo, glowMat);
    gravityGroup.add(sunGlow);

    // Grid Floor Plane for Gravitational Curvature Reference
    const grid = new THREE.GridHelper(70, 40, 0x00f0ff, 0x1e293b);
    grid.position.y = -0.5;
    gravityGroup.add(grid);

    // Spawn 3 Initial Realistic Planets with Stable Elliptical Orbits
    spawnPlanet(10, 0, 0, 0, 0, 9.8, 0x00f0ff, 0.65, 'Earth-like');
    spawnPlanet(18, 0, 0, 0, 0, 7.4, 0xf59e0b, 1.1, 'Gas Giant');
    spawnPlanet(-26, 0, 0, 0, 0, -6.1, 0xa855f7, 0.85, 'Outer Ice');
  }

  function spawnPlanet(px, py, pz, vx, vy, vz, colorHex, radius, name) {
    const geo = new THREE.SphereGeometry(radius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.4,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    gravityGroup.add(mesh);

    // Trail Line Geometry
    const maxTrail = 180;
    const trailPositions = new Float32Array(maxTrail * 3);
    for (let i = 0; i < maxTrail * 3; i += 3) {
      trailPositions[i] = px;
      trailPositions[i + 1] = py;
      trailPositions[i + 2] = pz;
    }
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.5
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    gravityGroup.add(trailLine);

    planets.push({
      mesh,
      pos: new THREE.Vector3(px, py, pz),
      vel: new THREE.Vector3(vx, vy, vz),
      mass: radius * 2,
      trailLine,
      trailPoints: [],
      maxTrail
    });
  }

  function updateGravitySim(delta) {
    const dt = delta * simSpeed;
    let totalKE = 0;
    let totalPE = 0;

    planets.forEach(p => {
      // Newton Gravitational Acceleration: a = -G * M / r^2 in direction of sun
      const rVec = new THREE.Vector3(0, 0, 0).sub(p.pos);
      const dist = Math.max(rVec.length(), 3.5); // Prevent singularity at center
      const forceMag = (gConstant * sunMass) / (dist * dist);
      const accel = rVec.normalize().multiplyScalar(forceMag);

      p.vel.addScaledVector(accel, dt);
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);

      // Energy Telemetry
      const v = p.vel.length();
      totalKE += 0.5 * p.mass * v * v;
      totalPE -= (gConstant * sunMass * p.mass) / dist;

      // Update Trail
      p.trailPoints.unshift(p.pos.clone());
      if (p.trailPoints.length > p.maxTrail) p.trailPoints.pop();

      const positions = p.trailLine.geometry.attributes.position.array;
      for (let i = 0; i < p.trailPoints.length; i++) {
        positions[i * 3] = p.trailPoints[i].x;
        positions[i * 3 + 1] = p.trailPoints[i].y;
        positions[i * 3 + 2] = p.trailPoints[i].z;
      }
      p.trailLine.geometry.attributes.position.needsUpdate = true;
    });

    // Update Telemetry UI
    document.getElementById('telem-label-1').innerText = 'Kinetic Energy (KE):';
    document.getElementById('telem-val-1').innerText = `${Math.round(totalKE)} J`;
    document.getElementById('telem-label-2').innerText = 'Potential Energy (PE):';
    document.getElementById('telem-val-2').innerText = `${Math.round(totalPE)} J`;
    document.getElementById('telem-label-3').innerText = 'Mechanical Energy (E):';
    document.getElementById('telem-val-3').innerText = `${Math.round(totalKE + totalPE)} J (Conserved)`;
  }

  // =========================================================================
  // SIMULATION 2: QUANTUM BOHR ATOM & PHOTON EMISSION
  // =========================================================================
  let nucleusGroup = new THREE.Group();
  let electronMesh, photonShockwave;
  let electronShells = [];
  let currentShellN = 2;
  let targetShellN = 2;
  let electronAngle = 0;
  let electronSpeedFactor = 1.0;
  let isLeaping = false;

  const SHELL_RADII = { 1: 5, 2: 9, 3: 14, 4: 20 };

  function buildAtomSim() {
    atomGroup.add(nucleusGroup);

    // 1. Clustered Nucleus (Protons & Neutrons)
    const pGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const pMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 }); // Protons (Red)
    const nMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 }); // Neutrons (Blue)

    for (let i = 0; i < 14; i++) {
      const isProton = i % 2 === 0;
      const sphere = new THREE.Mesh(pGeo, isProton ? pMat : nMat);
      sphere.position.set(
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6
      );
      nucleusGroup.add(sphere);
    }

    // 2. Glowing Concentric Bohr Orbit Shells (n = 1, 2, 3, 4)
    [1, 2, 3, 4].forEach(n => {
      const r = SHELL_RADII[n];
      const ringGeo = new THREE.RingGeometry(r - 0.04, r + 0.04, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      atomGroup.add(ring);
      electronShells.push({ n, r, ring, ringMat });
    });

    // 3. The Orbiting Quantum Electron
    const eGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const eMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    electronMesh = new THREE.Mesh(eGeo, eMat);
    atomGroup.add(electronMesh);

    // 4. Expanding Photon Wavefront (Shockwave Ring)
    const pWaveGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    const pWaveMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    photonShockwave = new THREE.Mesh(pWaveGeo, pWaveMat);
    photonShockwave.rotation.x = Math.PI / 2;
    atomGroup.add(photonShockwave);
  }

  function updateAtomSim(time, delta) {
    // 1. Subtle Nuclear Vibration
    nucleusGroup.children.forEach((c, idx) => {
      c.position.y += Math.sin(time * 15 + idx) * 0.005;
    });

    // 2. Electron Orbital Motion
    const currentRadius = SHELL_RADII[currentShellN];
    electronAngle += (2.5 / Math.sqrt(currentRadius)) * electronSpeedFactor * delta;

    electronMesh.position.x = Math.cos(electronAngle) * currentRadius;
    electronMesh.position.z = Math.sin(electronAngle) * currentRadius;
    electronMesh.position.y = Math.sin(time * 6) * 0.2; // Quantum vertical oscillation

    // 3. Photon Shockwave Expansion
    if (photonShockwave.material.opacity > 0) {
      photonShockwave.scale.multiplyScalar(1.08);
      photonShockwave.material.opacity -= 0.02;
    }

    // Telemetry
    document.getElementById('telem-label-1').innerText = 'Principal Quantum Number:';
    document.getElementById('telem-val-1').innerText = `n = ${currentShellN}`;
    document.getElementById('telem-label-2').innerText = 'Orbital Energy (E_n):';
    const energyEv = (-13.6 / (currentShellN * currentShellN)).toFixed(2);
    document.getElementById('telem-val-2').innerText = `${energyEv} eV`;
    document.getElementById('telem-label-3').innerText = 'de Broglie Wavelength:';
    document.getElementById('telem-val-3').innerText = `${(0.33 * currentShellN).toFixed(2)} nm`;
  }

  function triggerQuantumTransition(targetN) {
    if (targetN === currentShellN) return;
    const oldN = currentShellN;
    currentShellN = targetN;

    const deltaE = Math.abs(-13.6 / (oldN * oldN) - -13.6 / (targetN * targetN));
    const wavelengthNm = Math.round(1240 / deltaE);

    // Color of emitted photon based on wavelength
    let photonColor = 0x00f0ff;
    let label = `${wavelengthNm} nm (Visible)`;
    if (wavelengthNm > 600) { photonColor = 0xf43f5e; label = `${wavelengthNm} nm (Balmer Red)`; }
    else if (wavelengthNm > 480) { photonColor = 0x00f0ff; label = `${wavelengthNm} nm (Balmer Cyan)`; }
    else if (wavelengthNm > 420) { photonColor = 0x3b82f6; label = `${wavelengthNm} nm (Blue)`; }
    else { photonColor = 0xa855f7; label = `${wavelengthNm} nm (Violet/UV)`; }

    document.getElementById('meter-wavelength').innerText = label;
    document.getElementById('meter-energy').innerText = `${deltaE.toFixed(2)} eV`;

    // Trigger expanding photon shockwave from electron's current position
    photonShockwave.position.copy(electronMesh.position);
    photonShockwave.scale.set(1, 1, 1);
    photonShockwave.material.color.setHex(photonColor);
    photonShockwave.material.opacity = 1.0;

    audio.playQuantumChime(wavelengthNm);
    showToast(`⚡ Quantum Leap: n=${oldN} ➔ n=${targetN} | Emitted: ${label}`);
  }

  // =========================================================================
  // SIMULATION 3: OPTICAL PRISM LIGHT DISPERSION (SNELL'S LAW)
  // =========================================================================
  let prismMesh, incidentBeam, spectrumBeams = [];
  let incidentAngleDeg = 45;
  let glassIor = 1.52;
  let dispersionSpread = 1.0;

  const SPECTRUM_COLORS = [
    { name: 'Red', hex: 0xff0033, lambda: 700, iorOffset: -0.02 },
    { name: 'Orange', hex: 0xff7700, lambda: 620, iorOffset: -0.012 },
    { name: 'Yellow', hex: 0xffdd00, lambda: 580, iorOffset: -0.005 },
    { name: 'Green', hex: 0x00ff66, lambda: 530, iorOffset: 0.002 },
    { name: 'Cyan', hex: 0x00ffff, lambda: 490, iorOffset: 0.009 },
    { name: 'Blue', hex: 0x0066ff, lambda: 450, iorOffset: 0.016 },
    { name: 'Violet', hex: 0x8800ff, lambda: 400, iorOffset: 0.025 }
  ];

  function buildPrismSim() {
    // 1. Triangular Glass Prism Geometry
    const prismShape = new THREE.Shape();
    const side = 12;
    const h = (Math.sqrt(3) / 2) * side;
    prismShape.moveTo(-side / 2, -h / 3);
    prismShape.lineTo(side / 2, -h / 3);
    prismShape.lineTo(0, (2 * h) / 3);
    prismShape.closePath();

    const extrudeSettings = { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 };
    const prismGeo = new THREE.ExtrudeGeometry(prismShape, extrudeSettings);
    prismGeo.center();

    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: 0.6,
      ior: 1.52
    });
    prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismGroup.add(prismMesh);

    // 2. Incoming White Light Beam
    const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, 22, 16);
    beamGeo.center();
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    incidentBeam = new THREE.Mesh(beamGeo, beamMat);
    prismGroup.add(incidentBeam);

    // 3. Outgoing Dispersed Rainbow Beams (7 Wavelengths)
    SPECTRUM_COLORS.forEach(c => {
      const rayGeo = new THREE.CylinderGeometry(0.08, 0.08, 26, 16);
      rayGeo.center();
      const rayMat = new THREE.MeshBasicMaterial({ color: c.hex });
      const rayMesh = new THREE.Mesh(rayGeo, rayMat);
      prismGroup.add(rayMesh);
      spectrumBeams.push({ mesh: rayMesh, color: c });
    });

    // 4. White Projection Screen
    const screenGeo = new THREE.BoxGeometry(0.3, 16, 26);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(16, 0, 0);
    prismGroup.add(screen);

    updatePrismBeams();
  }

  function updatePrismBeams() {
    const thetaRad = (incidentAngleDeg * Math.PI) / 180;

    // Position incoming beam hitting left face of prism
    incidentBeam.position.set(-11, Math.tan(thetaRad - Math.PI / 4) * 4, 0);
    incidentBeam.rotation.z = Math.PI / 2 + thetaRad * 0.4;

    // Disperse outgoing rainbow rays
    spectrumBeams.forEach((ray, i) => {
      const spreadAngle = ((i - 3) * 0.06 * dispersionSpread) + (glassIor - 1.5) * 0.4;
      ray.mesh.position.set(9, (i - 3) * 1.4 * dispersionSpread, 0);
      ray.mesh.rotation.z = Math.PI / 2 - 0.25 + spreadAngle;
    });

    // Telemetry
    document.getElementById('telem-label-1').innerText = 'Incident Angle (θ₁):';
    document.getElementById('telem-val-1').innerText = `${incidentAngleDeg}°`;
    document.getElementById('telem-label-2').innerText = 'Violet Dev Angle:';
    document.getElementById('telem-val-2').innerText = `${(incidentAngleDeg * 1.15).toFixed(1)}° (Max Bend)`;
    document.getElementById('telem-label-3').innerText = 'Red Dev Angle:';
    document.getElementById('telem-val-3').innerText = `${(incidentAngleDeg * 0.92).toFixed(1)}° (Min Bend)`;
  }

  // =========================================================================
  // Experiment Switcher & UI Navigation
  // =========================================================================
  function switchExperiment(key) {
    activeExperiment = key;

    // Toggle 3D Groups visibility
    gravityGroup.visible = (key === 'gravity');
    atomGroup.visible = (key === 'atom');
    prismGroup.visible = (key === 'prism');

    // Toggle Controls Panel Sub-groups
    document.getElementById('controls-gravity').style.display = (key === 'gravity' ? 'block' : 'none');
    document.getElementById('controls-atom').style.display = (key === 'atom' ? 'block' : 'none');
    document.getElementById('controls-prism').style.display = (key === 'prism' ? 'block' : 'none');

    // Update Tab UI
    document.querySelectorAll('.exp-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.exp === key);
    });

    // Update Header / Concept Dock Content
    const data = EXPERIMENT_DATA[key];
    document.getElementById('panel-exp-tag').innerText = data.tag;
    document.getElementById('panel-exp-title').innerText = data.title;

    document.getElementById('dock-formula').innerText = data.formula;
    document.getElementById('dock-formula-desc').innerText = data.desc;
    document.getElementById('dock-feynman').innerText = data.feynman;
    document.getElementById('dock-impact').innerText = data.impact;

    // Reposition camera per experiment
    if (key === 'gravity') {
      camera.position.set(0, 30, 42);
      controls.target.set(0, 0, 0);
    } else if (key === 'atom') {
      camera.position.set(0, 24, 32);
      controls.target.set(0, 0, 0);
    } else if (key === 'prism') {
      camera.position.set(0, 18, 30);
      controls.target.set(0, 0, 0);
    }

    showToast(`🔬 Experiment Loaded: ${data.title}`);
  }

  // =========================================================================
  // Main Render Loop
  // =========================================================================
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    controls.update();

    if (activeExperiment === 'gravity') {
      updateGravitySim(delta);
      sunGlow.rotation.y = time * 0.2;
    } else if (activeExperiment === 'atom') {
      updateAtomSim(time, delta);
    } else if (activeExperiment === 'prism') {
      prismMesh.rotation.y = Math.sin(time * 0.4) * 0.05;
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // =========================================================================
  // UI & Slider Event Listeners
  // =========================================================================
  function initUI() {
    // Tab switching
    document.querySelectorAll('.exp-tab').forEach(btn => {
      btn.addEventListener('click', () => switchExperiment(btn.dataset.exp));
    });

    // Reset Lab Button
    document.getElementById('btn-reset-exp').addEventListener('click', () => {
      switchExperiment(activeExperiment);
      showToast('↺ Simulation Reset to Initial Physics State');
    });

    // Sound Button
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const on = audio.toggle();
      btnSound.querySelector('.btn-text').innerText = on ? 'Audio: ON' : 'Audio: OFF';
      showToast(on ? '🎵 Science Audio Active' : '🔇 Audio Muted');
    });

    // --- Gravity Controls ---
    const sliderG = document.getElementById('slider-g-const');
    sliderG.addEventListener('input', e => {
      gConstant = parseFloat(e.target.value);
      document.getElementById('val-g-const').innerText = `${gConstant.toFixed(1)}x`;
      audio.playGravityHum();
    });

    const sliderSunMass = document.getElementById('slider-sun-mass');
    sliderSunMass.addEventListener('input', e => {
      sunMass = parseFloat(e.target.value);
      document.getElementById('val-sun-mass').innerText = `${sunMass} M☉`;
      sunMesh.scale.setScalar(Math.pow(sunMass / 1000, 0.33));
    });

    const sliderSimSpeed = document.getElementById('slider-sim-speed');
    sliderSimSpeed.addEventListener('input', e => {
      simSpeed = parseFloat(e.target.value);
      document.getElementById('val-sim-speed').innerText = `${simSpeed.toFixed(1)}x`;
    });

    document.getElementById('btn-add-planet').addEventListener('click', () => {
      const dist = 12 + Math.random() * 18;
      const v = Math.sqrt((gConstant * sunMass) / dist) * (0.85 + Math.random() * 0.3);
      const angle = Math.random() * Math.PI * 2;
      const px = Math.cos(angle) * dist;
      const pz = Math.sin(angle) * dist;
      const vx = -Math.sin(angle) * v;
      const vz = Math.cos(angle) * v;
      const colors = [0x00f0ff, 0x10b981, 0xf59e0b, 0xf43f5e, 0xa855f7];
      const c = colors[Math.floor(Math.random() * colors.length)];

      spawnPlanet(px, 0, pz, vx, 0, vz, c, 0.5 + Math.random() * 0.7, 'Custom Planet');
      audio.playGravityHum();
      showToast('🪐 New Planet Launched into Orbit!');
    });

    document.getElementById('btn-clear-trails').addEventListener('click', () => {
      planets.forEach(p => {
        p.trailPoints = [];
      });
      showToast('Trails Cleared');
    });

    // --- Atom Controls ---
    document.querySelectorAll('.btn-shell').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-shell').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        targetShellN = parseInt(btn.dataset.shell);
      });
    });

    document.getElementById('btn-quantum-leap').addEventListener('click', () => {
      triggerQuantumTransition(targetShellN);
    });

    const sliderESpeed = document.getElementById('slider-electron-speed');
    sliderESpeed.addEventListener('input', e => {
      electronSpeedFactor = parseFloat(e.target.value);
      document.getElementById('val-electron-speed').innerText = `${electronSpeedFactor.toFixed(1)}x`;
    });

    // --- Prism Controls ---
    const sliderAngle = document.getElementById('slider-beam-angle');
    sliderAngle.addEventListener('input', e => {
      incidentAngleDeg = parseFloat(e.target.value);
      document.getElementById('val-beam-angle').innerText = `${incidentAngleDeg}°`;
      updatePrismBeams();
    });

    const sliderGlassIor = document.getElementById('slider-glass-ior');
    sliderGlassIor.addEventListener('input', e => {
      glassIor = parseFloat(e.target.value);
      document.getElementById('val-glass-ior').innerText = `${glassIor.toFixed(2)}`;
      prismMesh.material.ior = glassIor;
      updatePrismBeams();
    });

    const sliderDisp = document.getElementById('slider-dispersion-width');
    sliderDisp.addEventListener('input', e => {
      dispersionSpread = parseFloat(e.target.value);
      document.getElementById('val-disp-width').innerText = `${dispersionSpread.toFixed(1)}x`;
      updatePrismBeams();
    });

    // Bottom Dock Collapse Toggle
    const dock = document.getElementById('concept-dock');
    document.getElementById('btn-toggle-dock').addEventListener('click', () => {
      dock.classList.toggle('collapsed');
    });
  }

  function showToast(msg) {
    const toast = document.getElementById('lab-toast');
    toast.innerText = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initThree();
    initUI();
  });
})();
