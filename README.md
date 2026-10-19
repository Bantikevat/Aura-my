# 🔬 OMNILAB 3D: Interactive Science & Physics Simulation Engine

> An interactive 3D WebGL (Three.js) science laboratory designed to make IIT, Quantum Physics, and Fundamental Science concepts 100x easier to master through hands-on visual experimentation.

![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)
![Target](https://img.shields.io/badge/Designed%20For-IIT%20%7C%20Physics%20%7C%20Science%20Students-blue.svg)
![Simulations](https://img.shields.io/badge/3D%20Labs-Gravity%20%7C%20Quantum%20Atom%20%7C%20Prism%20Optics-emerald.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 🌟 Why This Exists (100x Better than 2D Textbooks)

Reading formulas in 2D textbooks or flat flashcards fails to build physical intuition:
* In 2D, you cannot see how changing mass or velocity distorts space-time and bends planetary orbits.
* In 2D, a "quantum leap" is just an equation $\Delta E = h\nu$, not an electron transitioning between quantized shells emitting a physical photon wavelength.
* In 2D, Snell's law is a static ray diagram rather than real optical glass dispersing white light into 7 wavelengths.

**OmniLab 3D turns passive reading into an interactive, real-time 3D experimental physics laboratory.**

---

## 🚀 3 Interactive 3D Laboratories

### 1. 🪐 Gravitational Orbits & Keplerian Mechanics
* **Newton's Law of Gravitation:** $F = G \frac{m_1 m_2}{r^2}$
* **Real-time 3D Gravity Simulation:** Sliders for Gravitational Constant ($G$), Star Mass ($M$), and Simulation Speed.
* **Launch Custom Planets:** Add new celestial bodies in real time to witness elliptical orbits, escape velocities, and gravitational slingshots!
* **Live Energy Conservation:** Real-time Kinetic Energy (KE), Potential Energy (PE), and Total Mechanical Energy tracking.

### 2. ⚛️ Quantum Bohr Atom & Spectral Line Leaps
* **Quantized Electron Shells:** Concentric shells ($n = 1, 2, 3, 4$) with orbiting de Broglie electron wave mechanics.
* **Trigger Quantum Leap:** Transition electrons between shells (e.g. $n=3 \to n=2$) to release an expanding photon wave.
* **Exact Wavelengths:** Calculates real spectral lines:
  * $n=3 \to n=2$: **656 nm (Balmer Red)**
  * $n=4 \to n=2$: **486 nm (Balmer Cyan)**
  * Releases real acoustic frequencies via Web Audio API.

### 3. 🌈 Optical Glass Prism & Snell's Law
* **Wavelength-Dependent Refraction:** Cauchy's equation dispersion $n(\lambda) = A + \frac{B}{\lambda^2}$.
* **Real 3D Prism Geometry:** Interactive triangular glass prism with high-transmission material.
* **Full Spectrum Dispersion:** White collimated light beam splits into the 7 rainbow spectral beams (VIBGYOR).
* **Interactive Parameters:** Sliders for Incident Light Angle ($\theta$), Glass Refraction Index ($n = 1.52$), and Dispersion Spread.

---

## 📐 First-Principles & IIT Theory Explainer Dock
Every experiment includes an expandable bottom dock containing:
1. **Fundamental Equation:** The exact mathematical formula.
2. **10-Year-Old Feynman Explanation:** Intuitive, jargon-free analogies.
3. **Real-World / IIT Application:** How ISRO, NASA, Lasers, and Fiber Optics leverage the law.

---

## 💻 How to Run Locally

1. Double-click [`index.html`](file:///c:/Users/sam/Downloads/banti%20doc/vartual%20tak%20maneger/index.html) in your browser.
2. Or run via local server:
   ```bash
   npx serve .
   ```
   Open `http://localhost:4173` in your browser.

---

## 📄 License
MIT License. Created with ❤️ by [Bantikevat](https://github.com/Bantikevat).
