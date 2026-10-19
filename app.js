/**
 * DEVSTUDIO 3D - Autonomous Virtual IT Office & Spatial Task Hub
 * Built with Three.js & Vanilla JavaScript
 * Zero external asset dependencies - 100% Procedural & Self-Contained
 */

(function () {
  'use strict';

  // =========================================================================
  // State & Data Models
  // =========================================================================
  const AGENTS = {
    alex: {
      id: 'alex',
      name: 'Alex Rivera',
      role: 'Frontend Architect',
      deskPos: { x: -7, z: -3 },
      color: 0x00f0ff,
      avatarClass: 'avatar-alex',
      roleClass: 'role-frontend',
      state: 'working', // 'working' | 'idle' | 'walking' | 'meeting'
      currentTask: null,
      progress: 45,
      mesh: null,
      chairMesh: null
    },
    maya: {
      id: 'maya',
      name: 'Maya Lin',
      role: 'Backend / API Lead',
      deskPos: { x: -7, z: 3 },
      color: 0x10b981,
      avatarClass: 'avatar-maya',
      roleClass: 'role-backend',
      state: 'working',
      currentTask: null,
      progress: 70,
      mesh: null,
      chairMesh: null
    },
    titan: {
      id: 'titan',
      name: 'Titan K',
      role: 'DevOps & Cloud Sec',
      deskPos: { x: 7, z: 6 }, // Server room workstation
      color: 0xf59e0b,
      avatarClass: 'avatar-titan',
      roleClass: 'role-devops',
      state: 'working',
      currentTask: null,
      progress: 25,
      mesh: null,
      chairMesh: null
    },
    sarah: {
      id: 'sarah',
      name: 'Sarah Chen',
      role: 'Product & QA Lead',
      deskPos: { x: 5, z: -4 }, // War room / PM desk
      color: 0xa855f7,
      avatarClass: 'avatar-sarah',
      roleClass: 'role-pm',
      state: 'working',
      currentTask: null,
      progress: 85,
      mesh: null,
      chairMesh: null
    }
  };

  let tasks = [
    {
      id: 't-1',
      title: 'Design Spatial 3D UI & Glassmorphism HUD',
      agent: 'alex',
      priority: 'high',
      status: 'in-progress',
      progress: 75,
      desc: 'Implement responsive glass panels, real-time metrics, and Three.js canvas HUD overlay.'
    },
    {
      id: 't-2',
      title: 'Build Microservices Telemetry & API Endpoints',
      agent: 'maya',
      priority: 'normal',
      status: 'in-progress',
      progress: 60,
      desc: 'Set up REST/WebSocket pipelines for real-time task sync and state persistence.'
    },
    {
      id: 't-3',
      title: 'Deploy Kubernetes Cluster & Zero-Downtime Pipeline',
      agent: 'titan',
      priority: 'critical',
      status: 'in-progress',
      progress: 30,
      desc: 'Configure Docker containers, health checks, and automatic rolling upgrades.'
    },
    {
      id: 't-4',
      title: 'Sprint 42 Roadmap Review & QA Validation',
      agent: 'sarah',
      priority: 'normal',
      status: 'completed',
      progress: 100,
      desc: 'Verify cross-browser 60 FPS benchmarks and finalize release deliverables.'
    }
  ];

  // =========================================================================
  // Web Audio API Sound Synthesizer (Zero External Audio Files)
  // =========================================================================
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.ambientGain = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.enabled = true;
      this.playAmbience();
    }

    playAmbience() {
      if (!this.enabled || !this.ctx) return;
      // Soft Lo-Fi drone chord
      const freqs = [130.81, 164.81, 196.00, 246.94]; // Cmaj7 low chord
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        osc.connect(this.ambientGain);
        osc.start();
      });
    }

    playKeyClick() {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playSuccessChime() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.05, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
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

  const sound = new SoundFX();

  // =========================================================================
  // Three.js 3D Virtual IT Studio
  // =========================================================================
  let scene, camera, renderer, controls;
  const interactiveObjects = [];
  let raycaster, mouse;
  let serverLEDs = [];
  let steamParticles;
  let codeTextureCanvases = [];
  let isNightMode = true;

  // Camera targets for smooth animation
  let cameraTargetPos = new THREE.Vector3(18, 16, 20);
  let cameraTargetLookAt = new THREE.Vector3(0, 1, 0);

  const CAMERA_PRESETS = {
    overview: { pos: new THREE.Vector3(18, 16, 20), look: new THREE.Vector3(0, 1, 0) },
    frontend: { pos: new THREE.Vector3(-4, 6, -1), look: new THREE.Vector3(-7, 2, -3) },
    servers: { pos: new THREE.Vector3(5, 5, 8), look: new THREE.Vector3(8, 2.5, 4) },
    meeting: { pos: new THREE.Vector3(3, 7, -2), look: new THREE.Vector3(6, 1.5, -4) },
    lounge: { pos: new THREE.Vector3(-3, 6, 6), look: new THREE.Vector3(-3, 1.5, 7) }
  };

  function init3D() {
    const container = document.getElementById('canvas-container');

    // Scene & Fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090c14);
    scene.fog = new THREE.FogExp2(0x090c14, 0.025);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 120);
    camera.position.copy(cameraTargetPos);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Don't go below floor
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controls.target.copy(cameraTargetLookAt);

    // Raycasting for 3D clicks
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Build the World
    setupLights();
    buildOfficeFloorAndWalls();
    buildDeveloperBays();
    buildServerRoom();
    buildConferenceRoom();
    buildChillLounge();
    buildAgents();
    setupSteamEffect();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('pointerdown', onDocumentPointerDown);
    window.addEventListener('pointermove', onDocumentPointerMove);

    // Start Animation Loop
    animate();
  }

  // =========================================================================
  // Lighting System
  // =========================================================================
  let ambientLight, mainDirLight, serverPointLight, devPointLight, warRoomLight;

  function setupLights() {
    // Ambient Light
    ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    // Main Overhead Directional Light
    mainDirLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    mainDirLight.position.set(15, 25, 12);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 2048;
    mainDirLight.shadow.mapSize.height = 2048;
    mainDirLight.shadow.camera.near = 0.5;
    mainDirLight.shadow.camera.far = 60;
    const d = 16;
    mainDirLight.shadow.camera.left = -d;
    mainDirLight.shadow.camera.right = d;
    mainDirLight.shadow.camera.top = d;
    mainDirLight.shadow.camera.bottom = -d;
    mainDirLight.shadow.bias = -0.0005;
    scene.add(mainDirLight);

    // Cyan Neon Accent Light over Dev Bay
    devPointLight = new THREE.PointLight(0x00f0ff, 2.2, 16);
    devPointLight.position.set(-7, 4, 0);
    scene.add(devPointLight);

    // Amber/Green Point Light inside Server Room
    serverPointLight = new THREE.PointLight(0x10b981, 2.5, 14);
    serverPointLight.position.set(8, 4, 4);
    scene.add(serverPointLight);

    // Violet Point Light inside Conference Room
    warRoomLight = new THREE.PointLight(0xa855f7, 2.0, 14);
    warRoomLight.position.set(6, 4, -4);
    scene.add(warRoomLight);
  }

  // =========================================================================
  // Procedural 3D Office Construction
  // =========================================================================
  function buildOfficeFloorAndWalls() {
    // Main Floor with Subtle Grid Pattern
    const floorGeo = new THREE.PlaneGeometry(32, 26);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
    const floorTexture = new THREE.CanvasTexture(canvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(6, 5);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.4,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Baseboard Perimeter Trim (gives high-end finish)
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const trimNorth = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 0.4), trimMat);
    trimNorth.position.set(0, 0.2, -13);
    scene.add(trimNorth);

    const trimSouth = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 0.4), trimMat);
    trimSouth.position.set(0, 0.2, 13);
    scene.add(trimSouth);

    const trimEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 26), trimMat);
    trimEast.position.set(16, 0.2, 0);
    scene.add(trimEast);

    const trimWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 26), trimMat);
    trimWest.position.set(-16, 0.2, 0);
    scene.add(trimWest);

    // Glass Wall Partition for Server Room & War Room
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.5
    });

    // Server Room Glass Wall (Separates right back quadrant)
    const serverWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 12), glassMat);
    serverWall.position.set(2, 2.25, 7);
    scene.add(serverWall);

    // War Room Glass Partition (Separates right front quadrant)
    const warRoomWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 12), glassMat);
    warRoomWall.position.set(2, 2.25, -7);
    scene.add(warRoomWall);

    // Architectural Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const pillarPositions = [
      [-15.5, -12.5], [15.5, -12.5],
      [-15.5, 12.5], [15.5, 12.5],
      [2, 0]
    ];
    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 0.8), pillarMat);
      pillar.position.set(px, 3, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    });
  }

  // Helper to create glowing animated screen texture
  function createCodeScreenTexture(label, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    function redraw(frame) {
      ctx.fillStyle = '#040d1a';
      ctx.fillRect(0, 0, 512, 256);

      // Header bar
      ctx.fillStyle = '#0f2744';
      ctx.fillRect(0, 0, 512, 32);
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`● DevStudio IDE - [${label}.tsx]`, 16, 22);

      // Syntax highlighted simulated code lines
      ctx.font = '13px monospace';
      const lines = [
        'import { useState, useEffect } from "react";',
        'import { ThreeEngine, ParticleSystem } from "@dev/core";',
        'export const SpatialCluster = () => {',
        '  const [status, setStatus] = useState("OPTIMAL");',
        '  const metrics = useTelemetry({ interval: 50 });',
        '  // Execute autonomous task execution pipeline',
        '  return <VirtualAgentWorker live={true} fps={60} />;',
        '};'
      ];

      lines.forEach((line, i) => {
        const y = 60 + i * 22;
        ctx.fillStyle = i % 2 === 0 ? colorHex : '#94a3b8';
        ctx.fillText(line, 20, y);
      });

      // Animated cursor blink
      if (Math.floor(frame / 20) % 2 === 0) {
        ctx.fillStyle = colorHex;
        ctx.fillRect(20 + ctx.measureText(lines[lines.length - 1]).width + 4, 60 + (lines.length - 1) * 22 - 12, 8, 16);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    codeTextureCanvases.push({ canvas, ctx, texture, redraw, label, colorHex });
    return texture;
  }

  // =========================================================================
  // Zone 1: Developer Bays (Alex & Maya Desks)
  // =========================================================================
  function buildDeveloperBays() {
    createWorkstation(-7, -3, 'alex', 'Alex Rivera (Frontend Bay)', 0x00f0ff);
    createWorkstation(-7, 3, 'maya', 'Maya Lin (Backend Bay)', 0x10b981);
  }

  function createWorkstation(x, z, agentId, title, glowColor) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Desk Top (Matte Dark Carbon)
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x182234, roughness: 0.3, metalness: 0.5 });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 2.2), deskTopMat);
    deskTop.position.set(0, 1.4, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    group.add(deskTop);

    // Desk Legs (Steel)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 16);
    const legOffsets = [[-1.9, -0.9], [1.9, -0.9], [-1.9, 0.9], [1.9, 0.9]];
    legOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.7, lz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Dual Curved Ultra-wide Monitors
    const screenTexture = createCodeScreenTexture(agentId.toUpperCase(), agentId === 'alex' ? '#00f0ff' : '#10b981');
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.9, roughness: 0.1 });

    // Monitor 1 (Left curved)
    const mon1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.08), screenFrameMat);
    mon1.position.set(-0.9, 2.2, 0.4);
    mon1.rotation.y = 0.2;
    const mon1Display = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.82), screenMat);
    mon1Display.position.set(-0.9, 2.2, 0.45);
    mon1Display.rotation.y = 0.2;
    group.add(mon1, mon1Display);

    // Monitor 2 (Right curved)
    const mon2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.08), screenFrameMat);
    mon2.position.set(0.9, 2.2, 0.4);
    mon2.rotation.y = -0.2;
    const mon2Display = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.82), screenMat);
    mon2Display.position.set(0.9, 2.2, 0.45);
    mon2Display.rotation.y = -0.2;
    group.add(mon2, mon2Display);

    // Monitor Stand
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.1), legMat);
    stand.position.set(0, 1.8, 0.35);
    group.add(stand);

    // Mechanical Keyboard with RGB Underglow
    const kb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.35), new THREE.MeshStandardMaterial({ color: 0x020617 }));
    kb.position.set(0, 1.5, -0.2);
    group.add(kb);

    // Mouse & Pad
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.7), new THREE.MeshStandardMaterial({ color: 0x0b1329 }));
    pad.position.set(0, 1.48, -0.2);
    group.add(pad);

    // Coffee Mug
    const mugMat = new THREE.MeshStandardMaterial({ color: glowColor, roughness: 0.2 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.24, 16), mugMat);
    mug.position.set(1.4, 1.6, -0.2);
    group.add(mug);

    // High-End Ergonomic Office Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, -1.1);

    const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), chairMat);
    seat.position.y = 1.0;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.12), chairMat);
    back.position.set(0, 1.5, -0.4);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 16), legMat);
    stem.position.y = 0.5;

    chairGroup.add(seat, back, stem);
    group.add(chairGroup);
    AGENTS[agentId].chairMesh = chairGroup;

    // Interactive Raycast Click Target
    deskTop.userData = {
      type: 'workstation',
      id: agentId,
      title: title,
      desc: `Specialized workspace with dual monitors, active Git branches, and automated CI/CD pipeline hooks.`,
      agent: AGENTS[agentId].name,
      status: 'Active Coding'
    };
    interactiveObjects.push(deskTop);

    scene.add(group);
  }

  // =========================================================================
  // Zone 2: Server Room / DevOps & Cloud Infrastructure
  // =========================================================================
  function buildServerRoom() {
    const group = new THREE.Group();
    group.position.set(8, 0, 4);

    // 3 Enterprise Server Racks
    for (let i = 0; i < 3; i++) {
      const rackX = (i - 1) * 2.2;
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 5.0, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 })
      );
      rack.position.set(rackX, 2.5, 0);
      rack.castShadow = true;
      group.add(rack);

      // Server Blade Slots & Blinking LEDs
      for (let s = 0; s < 7; s++) {
        const slotY = 0.8 + s * 0.6;
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.45, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
        );
        slot.position.set(rackX, slotY, 0.72);
        group.add(slot);

        // 3 LEDs per blade
        for (let l = 0; l < 3; l++) {
          const ledMat = new THREE.MeshBasicMaterial({ color: (l === 0 ? 0x10b981 : (l === 1 ? 0x00f0ff : 0xf59e0b)) });
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), ledMat);
          led.position.set(rackX - 0.4 + l * 0.4, slotY, 0.76);
          group.add(led);
          serverLEDs.push({ mesh: led, mat: ledMat, baseColor: ledMat.color.getHex(), phase: Math.random() * Math.PI * 2 });
        }
      }

      rack.userData = {
        type: 'server',
        id: 'titan',
        title: `Enterprise Server Cluster #${i + 1}`,
        desc: `High-availability cloud rack hosting Docker containers, PostgreSQL replicas, and Kafka event streams.`,
        agent: 'Titan K (DevOps)',
        status: '99.9% Uptime'
      };
      interactiveObjects.push(rack);
    }

    // DevOps Monitoring Terminal Desk for Titan
    const devopsDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.15, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x182234, roughness: 0.4 })
    );
    devopsDesk.position.set(0, 1.4, 2.8);
    group.add(devopsDesk);

    const devopsMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.0, 0.08),
      new THREE.MeshBasicMaterial({ map: createCodeScreenTexture('DEVOPS_METRICS', '#f59e0b') })
    );
    devopsMonitor.position.set(0, 2.2, 2.8);
    devopsMonitor.rotation.y = Math.PI;
    group.add(devopsMonitor);

    devopsDesk.userData = {
      type: 'workstation',
      id: 'titan',
      title: 'DevOps & Cloud Security Ops Center',
      desc: 'Live telemetry, AWS cluster health monitors, and automated container rollback systems.',
      agent: 'Titan K',
      status: 'Cluster Optimal'
    };
    interactiveObjects.push(devopsDesk);

    scene.add(group);
  }

  // =========================================================================
  // Zone 3: Conference / War Room
  // =========================================================================
  function buildConferenceRoom() {
    const group = new THREE.Group();
    group.position.set(6, 0, -4);

    // Large Conference Meeting Table
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.4 })
    );
    tableTop.position.set(0, 1.4, 0);
    tableTop.castShadow = true;
    group.add(tableTop);

    // Table Base
    const tableBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    tableBase.position.set(0, 0.7, 0);
    group.add(tableBase);

    // Floating Holographic Glass Whiteboard / Roadmap Display
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 248);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SPRINT 42 ROADMAP & ARCHITECTURE', 24, 38);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px sans-serif';
    ctx.fillText('✓ 3D Virtual Studio Engine Initialized', 30, 80);
    ctx.fillText('✓ Autonomous Multi-Agent Pathfinding Active', 30, 115);
    ctx.fillText('✓ Real-Time Web Audio Synthesizer Hooked', 30, 150);
    ctx.fillText('⚡ Next: Global Launch & Community Demo', 30, 185);

    const boardTex = new THREE.CanvasTexture(canvas);
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.08), boardMat);
    board.position.set(0, 3.2, -4.5);
    group.add(board);

    // 4 Meeting Chairs
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    angles.forEach(ang => {
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.4, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
      );
      chair.position.set(Math.cos(ang) * 2.8, 0.7, Math.sin(ang) * 2.8);
      chair.rotation.y = -ang + Math.PI / 2;
      group.add(chair);
    });

    tableTop.userData = {
      type: 'meeting',
      id: 'sarah',
      title: 'War Room & Sprint Command Center',
      desc: 'Central strategic hub where Product Leads, QA, and Architects align on deliverables.',
      agent: 'Sarah Chen (Lead)',
      status: 'Sprint Active'
    };
    interactiveObjects.push(tableTop);

    scene.add(group);
  }

  // =========================================================================
  // Zone 4: Chill Lounge & Coffee Bar
  // =========================================================================
  function buildChillLounge() {
    const group = new THREE.Group();
    group.position.set(-3, 0, 7);

    // Modern Sectional Couch
    const couchMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
    const couchSeat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 1.4), couchMat);
    couchSeat.position.set(0, 0.45, 0);
    const couchBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.4), couchMat);
    couchBack.position.set(0, 0.9, 0.7);
    group.add(couchSeat, couchBack);

    // Coffee Counter
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.0), counterMat);
    counter.position.set(3.2, 0.7, 0);
    group.add(counter);

    // High-Tech Espresso Machine
    const coffeeMachine = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.7, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 })
    );
    coffeeMachine.position.set(3.2, 1.75, 0);
    group.add(coffeeMachine);

    // Indoor Potted Plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    pot.position.set(-2.6, 0.35, 0);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.9 }));
    foliage.position.set(-2.6, 0.9, 0);
    group.add(pot, foliage);

    counter.userData = {
      type: 'lounge',
      id: 'lounge',
      title: 'Dev Energy Bar & Lo-Fi Lounge',
      desc: 'Free espresso machine and relaxation zone for developers recharging between sprints.',
      agent: 'Public Lounge',
      status: 'Espresso Ready'
    };
    interactiveObjects.push(counter);

    scene.add(group);
  }

  // =========================================================================
  // Coffee Steam Particles
  // =========================================================================
  function setupSteamEffect() {
    const particleCount = 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = 0.2 + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = 1.9 + Math.random() * 0.8;
      pos[i * 3 + 2] = 7.0 + (Math.random() - 0.5) * 0.2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.12,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    steamParticles = new THREE.Points(geo, mat);
    scene.add(steamParticles);
  }

  // =========================================================================
  // 3D Procedural Humanoid Agents (Avatars)
  // =========================================================================
  function buildAgents() {
    Object.keys(AGENTS).forEach(key => {
      const agent = AGENTS[key];
      const agentGroup = new THREE.Group();
      agentGroup.position.set(agent.deskPos.x, 0, agent.deskPos.y);

      // Body / Torso
      const torsoMat = new THREE.MeshStandardMaterial({ color: agent.color, roughness: 0.4 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), torsoMat);
      torso.position.y = 1.25;
      torso.castShadow = true;
      agentGroup.add(torso);

      // Head
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), headMat);
      head.position.y = 1.85;
      agentGroup.add(head);

      // Cyber Visor / Glasses
      const visorMat = new THREE.MeshBasicMaterial({ color: agent.color });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.1), visorMat);
      visor.position.set(0, 1.87, 0.2);
      agentGroup.add(visor);

      // Left Arm
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), torsoMat);
      leftArm.position.set(-0.42, 1.2, 0);
      agentGroup.add(leftArm);

      // Right Arm
      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), torsoMat);
      rightArm.position.set(0.42, 1.2, 0);
      agentGroup.add(rightArm);

      // Floating 3D Role/Status Orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshBasicMaterial({ color: agent.color })
      );
      orb.position.set(0, 2.3, 0);
      agentGroup.add(orb);

      agent.mesh = agentGroup;
      agent.leftArm = leftArm;
      agent.rightArm = rightArm;
      agent.orb = orb;

      // Make agent clickable
      torso.userData = {
        type: 'agent',
        id: agent.id,
        title: agent.name,
        desc: `${agent.role} currently assigned to active sprint execution.`,
        agent: agent.name,
        status: 'Active'
      };
      interactiveObjects.push(torso);

      scene.add(agentGroup);
    });
  }

  // =========================================================================
  // Raycasting & Click Interactions
  // =========================================================================
  function onDocumentPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onDocumentPointerDown(event) {
    // Ignore clicks if clicking on HTML UI panels
    if (event.target.closest('.top-nav, .agent-panel, .task-panel, .camera-toolbar, .inspection-card, .modal-backdrop')) {
      return;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
      const data = intersects[0].object.userData;
      if (data && data.title) {
        openInspectionCard(data, intersects[0].point);
      }
    }
  }

  function openInspectionCard(data, point) {
    const card = document.getElementById('inspection-card');
    document.getElementById('inspect-category').innerText = data.type.toUpperCase();
    document.getElementById('inspect-title').innerText = data.title;
    document.getElementById('inspect-description').innerText = data.desc;
    document.getElementById('inspect-agent').innerText = data.agent;
    document.getElementById('inspect-status').innerText = data.status;
    card.classList.add('active');

    // Link Assign Task button to this agent
    const assignBtn = document.getElementById('btn-inspect-assign');
    assignBtn.onclick = () => {
      openTaskModal(data.id);
    };

    // Focus Camera on Object
    const focusBtn = document.getElementById('btn-inspect-focus');
    focusBtn.onclick = () => {
      if (point) {
        focusCameraOn(point.x + 2, point.y + 3, point.z + 4, point.x, point.y, point.z);
      }
    };
  }

  function focusCameraOn(px, py, pz, lx, ly, lz) {
    cameraTargetPos.set(px, py, pz);
    cameraTargetLookAt.set(lx, ly, lz);
  }

  // =========================================================================
  // Main Render Loop & Animations
  // =========================================================================
  let clock = new THREE.Clock();
  let frameCount = 0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    frameCount++;

    // Smooth Camera Transition Lerp
    camera.position.lerp(cameraTargetPos, 0.05);
    controls.target.lerp(cameraTargetLookAt, 0.05);
    controls.update();

    // 1. Blinking Server LEDs Animation
    serverLEDs.forEach(led => {
      const blink = Math.sin(time * 8 + led.phase) > 0.3;
      led.mesh.visible = blink;
    });

    // 2. Coffee Steam Particle Motion
    if (steamParticles) {
      const pos = steamParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.015; // Move up
        if (pos[i * 3 + 1] > 2.8) {
          pos[i * 3 + 1] = 1.8; // Reset back to mug
        }
      }
      steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Redraw Animated IDE Screen Textures every 3 frames
    if (frameCount % 3 === 0) {
      codeTextureCanvases.forEach(item => {
        item.redraw(frameCount);
        item.texture.needsUpdate = true;
      });
    }

    // 4. Autonomous Agent Character Animations (Typing & Breathing)
    Object.keys(AGENTS).forEach(key => {
      const agent = AGENTS[key];
      if (agent.mesh) {
        // Subtle floating status orb
        agent.orb.position.y = 2.3 + Math.sin(time * 3 + (key.charCodeAt(0) % 5)) * 0.08;

        if (agent.state === 'working') {
          // Rapid typing arm motion
          agent.leftArm.rotation.x = -Math.PI / 4 + Math.sin(time * 14 + 1) * 0.15;
          agent.rightArm.rotation.x = -Math.PI / 4 + Math.cos(time * 16 + 2) * 0.15;
          // Random keyboard sound (if sound enabled)
          if (sound.enabled && Math.random() < 0.04) {
            sound.playKeyClick();
          }
        } else {
          // Idle breathing
          agent.mesh.position.y = Math.sin(time * 2) * 0.03;
        }
      }
    });

    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // =========================================================================
  // UI & Task Management DOM Controller
  // =========================================================================
  function initUI() {
    renderTaskList();
    updateMetrics();

    // Camera Preset Buttons
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const camKey = btn.dataset.cam;
        if (CAMERA_PRESETS[camKey]) {
          focusCameraOn(
            CAMERA_PRESETS[camKey].pos.x,
            CAMERA_PRESETS[camKey].pos.y,
            CAMERA_PRESETS[camKey].pos.z,
            CAMERA_PRESETS[camKey].look.x,
            CAMERA_PRESETS[camKey].look.y,
            CAMERA_PRESETS[camKey].look.z
          );
        }
      });
    });

    // Sound Toggle Button
    const btnAudio = document.getElementById('btn-audio');
    btnAudio.addEventListener('click', () => {
      const on = sound.toggle();
      if (on) {
        btnAudio.classList.add('active');
        btnAudio.querySelector('.btn-text').innerText = 'Audio: ON';
        showToast('🎵 Lo-Fi Ambience & Keyboard Sound Active');
      } else {
        btnAudio.classList.remove('active');
        btnAudio.querySelector('.btn-text').innerText = 'Lo-Fi Sound';
        showToast('🔇 Audio Muted');
      }
    });

    // Day / Cyberpunk Night Mode Toggle
    const btnTheme = document.getElementById('btn-theme');
    btnTheme.addEventListener('click', () => {
      isNightMode = !isNightMode;
      document.body.classList.toggle('theme-day', !isNightMode);
      document.body.classList.toggle('theme-night', isNightMode);

      if (isNightMode) {
        scene.background.setHex(0x090c14);
        scene.fog.color.setHex(0x090c14);
        ambientLight.intensity = 1.2;
        mainDirLight.intensity = 1.4;
        devPointLight.intensity = 2.2;
        serverPointLight.intensity = 2.5;
        btnTheme.querySelector('.btn-text').innerText = 'Cyberpunk Mode';
        showToast('⚡ Cyberpunk Hackathon Mode Active');
      } else {
        scene.background.setHex(0xe2e8f0);
        scene.fog.color.setHex(0xe2e8f0);
        ambientLight.intensity = 2.2;
        mainDirLight.intensity = 2.5;
        devPointLight.intensity = 0.8;
        serverPointLight.intensity = 1.0;
        btnTheme.querySelector('.btn-text').innerText = 'Daylight Studio';
        showToast('☀️ Daylight Silicon Valley Studio Active');
      }
    });

    // Add Task Modal Buttons
    const btnNewTask = document.getElementById('btn-new-task');
    const modal = document.getElementById('task-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');

    btnNewTask.addEventListener('click', () => openTaskModal());
    btnCloseModal.addEventListener('click', () => closeModal());
    btnCancelModal.addEventListener('click', () => closeModal());

    // Task Form Submit
    const form = document.getElementById('new-task-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('task-title').value.trim();
      const agent = document.getElementById('task-agent').value;
      const priority = document.getElementById('task-priority').value;
      const desc = document.getElementById('task-desc').value.trim();

      if (!title) return;

      const newTask = {
        id: 't-' + Date.now(),
        title,
        agent,
        priority,
        desc: desc || 'Direct execution order dispatched to autonomous 3D agent.',
        status: 'in-progress',
        progress: 10
      };

      tasks.unshift(newTask);
      renderTaskList();
      updateMetrics();
      closeModal();
      form.reset();

      // Trigger agent work animation
      AGENTS[agent].state = 'working';
      AGENTS[agent].progress = 15;
      updateAgentUI(agent);

      showToast(`🚀 Dispatched to ${AGENTS[agent].name}!`);

      // Automatically simulate progress over time
      simulateTaskProgress(newTask.id, agent);
    });

    // Close Inspection Tooltip
    document.getElementById('btn-close-inspect').addEventListener('click', () => {
      document.getElementById('inspection-card').classList.remove('active');
    });

    // Toggle Task Drawer
    const btnToggleTask = document.getElementById('btn-toggle-task-panel');
    btnToggleTask.addEventListener('click', () => {
      document.getElementById('task-panel').classList.toggle('collapsed');
    });

    // Filter Tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTaskList(tab.dataset.filter);
      });
    });

    // Agent Card Clicks in Roster
    document.querySelectorAll('.agent-card').forEach(card => {
      card.addEventListener('click', () => {
        const agentKey = card.dataset.agent;
        if (AGENTS[agentKey]) {
          const desk = AGENTS[agentKey].deskPos;
          focusCameraOn(desk.x + 3, 5, desk.y + 4, desk.x, 1.5, desk.y);
          showToast(`Focused on ${AGENTS[agentKey].name}`);
        }
      });
    });
  }

  function openTaskModal(preselectedAgent) {
    if (preselectedAgent && document.getElementById('task-agent')) {
      document.getElementById('task-agent').value = preselectedAgent;
    }
    document.getElementById('task-modal').classList.add('active');
    document.getElementById('task-title').focus();
  }

  function closeModal() {
    document.getElementById('task-modal').classList.remove('active');
  }

  function renderTaskList(filter = 'all') {
    const container = document.getElementById('task-list-container');
    container.innerHTML = '';

    const filtered = tasks.filter(t => {
      if (filter === 'active') return t.status === 'in-progress';
      if (filter === 'done') return t.status === 'completed';
      return true;
    });

    document.getElementById('task-total-badge').innerText = filtered.length;

    filtered.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card priority-${task.priority}`;

      const agentData = AGENTS[task.agent] || { name: task.agent };

      card.innerHTML = `
        <div class="task-card-header">
          <div class="task-title">${task.title}</div>
          <span class="task-status-badge ${task.status === 'completed' ? 'status-completed' : 'status-in-progress'}">
            ${task.status === 'completed' ? 'DONE' : task.progress + '%'}
          </span>
        </div>
        <div class="task-meta">
          <span class="task-agent-tag">⚡ ${agentData.name}</span>
          <span>${task.priority.toUpperCase()}</span>
        </div>
        <div class="task-progress-mini">
          <div class="task-progress-fill" style="width: ${task.progress}%;"></div>
        </div>
      `;

      card.addEventListener('click', () => {
        if (AGENTS[task.agent]) {
          const desk = AGENTS[task.agent].deskPos;
          focusCameraOn(desk.x + 3, 5, desk.y + 4, desk.x, 1.5, desk.y);
        }
      });

      container.appendChild(card);
    });
  }

  function updateMetrics() {
    const completed = tasks.filter(t => t.status === 'completed').length;
    document.getElementById('metric-completed').innerText = completed;
  }

  function updateAgentUI(agentKey) {
    const progBar = document.getElementById(`prog-${agentKey}`);
    const activity = document.getElementById(`activity-${agentKey}`);
    if (progBar) progBar.style.width = AGENTS[agentKey].progress + '%';
    if (activity) {
      activity.innerText = AGENTS[agentKey].state === 'working' ? 'Writing Code...' : 'Coffee Break ☕';
    }
  }

  // Autonomous Progress Engine
  function simulateTaskProgress(taskId, agentKey) {
    const interval = setInterval(() => {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.status === 'completed') {
        clearInterval(interval);
        return;
      }

      task.progress += Math.floor(Math.random() * 15) + 8;
      if (task.progress >= 100) {
        task.progress = 100;
        task.status = 'completed';
        clearInterval(interval);
        sound.playSuccessChime();
        showToast(`🎉 Task Completed by ${AGENTS[agentKey].name}!`);
        spawnCelebrationParticles(AGENTS[agentKey].deskPos.x, 2.5, AGENTS[agentKey].deskPos.y);
      }

      AGENTS[agentKey].progress = task.progress;
      updateAgentUI(agentKey);
      renderTaskList();
      updateMetrics();
    }, 1800);
  }

  // 3D Particle Celebration Burst on Task Completion
  function spawnCelebrationParticles(x, y, z) {
    const pCount = 60;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const vel = [];

    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      vel.push({
        x: (Math.random() - 0.5) * 0.15,
        y: Math.random() * 0.2 + 0.05,
        z: (Math.random() - 0.5) * 0.15
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.18,
      transparent: true,
      opacity: 1
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    let life = 0;
    const anim = setInterval(() => {
      life++;
      const pArr = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pArr[i * 3] += vel[i].x;
        pArr[i * 3 + 1] += vel[i].y;
        pArr[i * 3 + 2] += vel[i].z;
        vel[i].y -= 0.005; // gravity
      }
      particles.geometry.attributes.position.needsUpdate = true;
      mat.opacity -= 0.02;

      if (life > 50) {
        clearInterval(anim);
        scene.remove(particles);
      }
    }, 25);
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // Initialize Everything on Window Load
  window.addEventListener('DOMContentLoaded', () => {
    init3D();
    initUI();
  });
})();
