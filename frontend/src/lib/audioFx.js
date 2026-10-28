// Web Audio API Synthesizer for 8-bit / Cyber Arcade sound effects & ambient noise
class SoundFX {
  constructor() {
    this.ctx = null;
    this.ambientNodes = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Laser Attack Sound
  playLaser() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch { /* ignore */ }
  }

  // Heavy Hit / Damage
  playHit() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch { /* ignore */ }
  }

  // Success / Correct Answer (Upbeat chime)
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch { /* ignore */ }
  }

  // Level Up / Fanfare
  playLevelUp() {
    try {
      this.init();
      if (!this.ctx) return;
      const melody = [440, 554.37, 659.25, 880, 1108.73];
      melody.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = this.ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch { /* ignore */ }
  }

  // Error / Boss attack
  playFail() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch { /* ignore */ }
  }

  // Click / Bleep
  playBleep(high = false) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(high ? 800 : 440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch { /* ignore */ }
  }

  // Deep Space Warp Jump sound effect
  playWarpJump() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Sub-bass rumble drop
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(140, now);
      bassOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
      bassGain.gain.setValueAtTime(0.4, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 1.5);

      // Rising hyper-speed laser sweep
      const sweepOsc = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(200, now + 0.2);
      sweepOsc.frequency.exponentialRampToValueAtTime(1600, now + 1.1);
      sweepGain.gain.setValueAtTime(0.01, now + 0.2);
      sweepGain.gain.linearRampToValueAtTime(0.3, now + 0.9);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      sweepOsc.connect(sweepGain);
      sweepGain.connect(this.ctx.destination);
      sweepOsc.start(now + 0.2);
      sweepOsc.stop(now + 1.3);

      // Dimensional arrival chime
      setTimeout(() => this.playLevelUp(), 1100);
    } catch { /* ignore */ }
  }

  // Synthesized Ambient Sound (Rain / Space / Binaural)
  startAmbient(type) {
    this.stopAmbient();
    try {
      this.init();
      if (!this.ctx) return;

      if (type === 'space') {
        // Deep cosmic rumble + slow modulation
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 65; // Deep bass hum
        lfo.frequency.value = 0.2; // Slow breathing modulation
        lfoGain.gain.value = 15;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        lfo.start();
        this.ambientNodes = { osc, lfo, gain };
      } else if (type === 'rain') {
        // Synthesized pink noise for rain
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
          b6 = white * 0.115926;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Lowpass filter for smooth rain sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1100;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        this.ambientNodes = { noise, gain };
      } else if (type === 'binaural') {
        // Binaural alpha waves (140Hz and 150Hz)
        const oscL = this.ctx.createOscillator();
        const oscR = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        oscL.frequency.value = 140;
        oscR.frequency.value = 150; // 10Hz Alpha frequency diff
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);

        oscL.connect(gain);
        oscR.connect(gain);
        gain.connect(this.ctx.destination);

        oscL.start();
        oscR.start();
        this.ambientNodes = { oscL, oscR, gain };
      }
    } catch { /* ignore */ }
  }

  stopAmbient() {
    try {
      if (this.ambientNodes) {
        if (this.ambientNodes.osc) this.ambientNodes.osc.stop();
        if (this.ambientNodes.lfo) this.ambientNodes.lfo.stop();
        if (this.ambientNodes.noise) this.ambientNodes.noise.stop();
        if (this.ambientNodes.oscL) this.ambientNodes.oscL.stop();
        if (this.ambientNodes.oscR) this.ambientNodes.oscR.stop();
        this.ambientNodes = null;
      }
    } catch { /* ignore */ }
  }
}

export const sfx = new SoundFX();
