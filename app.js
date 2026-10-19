/**
 * FEYNMAN VAULT - First-Principles Deep Learning & Memory System
 * Richard Feynman Technique & Ebbinghaus Spaced Repetition Engine
 * 100% Client-Side • LocalStorage Persistence • Web Audio API Synthesis
 */

(function () {
  'use strict';

  // =========================================================================
  // Initial Seed Concepts (Scientific / IIT-Style First Principles Models)
  // =========================================================================
  const SEED_CONCEPTS = [
    {
      id: 'c-1',
      title: "Newton's Third Law of Motion",
      subject: 'Physics',
      bookDef: 'To every action, there is always an equal and opposite reaction.',
      feynmanExp: 'Aap kisi cheez ko jitne zor se dhakka doge, woh cheez bhi aapko utne hi zor se wapas dhakka degi. Agar aap zameen par na dabein, toh aap ek kadam bhi aage nahi chal sakte!',
      analogy: 'Nav (boat) se kinaray par jump karte waqt: aap aage jump karte ho toh nav peeche paani mein chali jaati hai.',
      rootCause: 'Conservation of Momentum (Gati ka Sanrakshan) - Force akele kabhi paida nahi ho sakti, hamesha pairs mein hoti hai.',
      level: 1, // 1: Day 1, 2: Day 3, 3: Day 7, 4: Mastered
      lastReviewed: Date.now() - 86400000, // Due today
      created: Date.now() - 86400000
    },
    {
      id: 'c-2',
      title: 'Binary Search Algorithm',
      subject: 'Computer Science',
      bookDef: 'An efficient search algorithm that finds the position of a target value within a sorted array in O(log N) time.',
      feynmanExp: 'Agar aap moti dictionary mein word dhoondh rahe ho, toh aap page 1 se shuru nahi karte. Aap beech mein se kholte ho. Agar aapka word peeche hai, toh aage ke 500 pages ko ek second mein kachre ki tarah chhod dete ho!',
      analogy: 'Dictionary ya telephone directory mein naam dhoondhna.',
      rootCause: 'Logarithmic Divide & Conquer - Har step par aadha kaam khatam kar dena.',
      level: 4,
      lastReviewed: Date.now() - 1000000,
      created: Date.now() - 7 * 86400000
    },
    {
      id: 'c-3',
      title: 'Compound Interest (Chakravriddhi Byaj)',
      subject: 'Mathematics',
      bookDef: 'Interest calculated on the initial principal and the accumulated interest of previous periods: A = P(1 + r/n)^nt.',
      feynmanExp: 'Aapke paise ka bachha hota hai, aur phir aage chalkar us bachhe ke bhi bachhe hone lagte hain! Shuruwat mein yeh bohot chhota lagta hai, lekin 10 saal baad yeh vishal banta hai.',
      analogy: 'Baraf ke pahaad se girta hua chhota snowball jo neeche aate-aate bohot bada ban jata hai.',
      rootCause: 'Exponential Geometric Progression (Gunaatmak Vridhi) vs Linear Growth.',
      level: 2,
      lastReviewed: Date.now(),
      created: Date.now() - 3 * 86400000
    }
  ];

  // Load from LocalStorage or use Seeds
  let concepts = [];
  try {
    const saved = localStorage.getItem('feynman_vault_concepts');
    concepts = saved ? JSON.parse(saved) : SEED_CONCEPTS;
  } catch (e) {
    concepts = SEED_CONCEPTS;
  }

  function saveConcepts() {
    try {
      localStorage.setItem('feynman_vault_concepts', JSON.stringify(concepts));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    updateMetrics();
  }

  // =========================================================================
  // Web Audio Procedural Study Sound & Chimes (Zero External Files)
  // =========================================================================
  class StudyAudio {
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
      this.startFocusDrone();
    }

    startFocusDrone() {
      if (!this.enabled || !this.ctx) return;
      // 432 Hz Calming Focus Chord (Beta to Alpha brainwave transition)
      const freqs = [108, 162, 216, 288];
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      this.droneGain.connect(this.ctx.destination);

      freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        osc.connect(this.droneGain);
        osc.start();
      });
    }

    playSuccessChime() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
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

  const audio = new StudyAudio();

  // =========================================================================
  // Pomodoro Timer Engine
  // =========================================================================
  let pomoTime = 25 * 60; // 25 mins
  let pomoRunning = false;
  let pomoInterval = null;

  function initPomodoro() {
    const dock = document.getElementById('pomodoro-dock');
    const headerDisplay = document.getElementById('header-timer-display');
    const display = document.getElementById('pomo-display');
    const btnToggle = document.getElementById('btn-toggle-timer');
    const btnClose = document.getElementById('btn-close-pomo');
    const btnStart = document.getElementById('btn-pomo-start');
    const btnReset = document.getElementById('btn-pomo-reset');

    btnToggle.addEventListener('click', () => {
      dock.classList.toggle('active');
    });

    btnClose.addEventListener('click', () => {
      dock.classList.remove('active');
    });

    function updatePomoDisplay() {
      const mins = Math.floor(pomoTime / 60);
      const secs = pomoTime % 60;
      const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      display.innerText = str;
      headerDisplay.innerText = str;
    }

    btnStart.addEventListener('click', () => {
      if (!pomoRunning) {
        pomoRunning = true;
        btnStart.innerText = 'Pause';
        pomoInterval = setInterval(() => {
          if (pomoTime > 0) {
            pomoTime--;
            updatePomoDisplay();
          } else {
            clearInterval(pomoInterval);
            pomoRunning = false;
            btnStart.innerText = 'Start';
            audio.playSuccessChime();
            showToast('🎓 Focus Session Complete! Take a 5-minute breather.');
          }
        }, 1000);
      } else {
        clearInterval(pomoInterval);
        pomoRunning = false;
        btnStart.innerText = 'Start';
      }
    });

    btnReset.addEventListener('click', () => {
      clearInterval(pomoInterval);
      pomoRunning = false;
      btnStart.innerText = 'Start';
      pomoTime = 25 * 60;
      updatePomoDisplay();
    });

    updatePomoDisplay();
  }

  // =========================================================================
  // Spaced Repetition Formula & Intervals (Ebbinghaus Curve)
  // =========================================================================
  function getLevelMeta(level) {
    switch (level) {
      case 1: return { name: 'Day 1 Review', class: 'retention-l1', intervalDays: 1 };
      case 2: return { name: 'Day 3 Review', class: 'retention-l2', intervalDays: 3 };
      case 3: return { name: 'Day 7 Review', class: 'retention-l3', intervalDays: 7 };
      case 4: return { name: 'Permanent Memory 🎓', class: 'retention-mastered', intervalDays: 21 };
      default: return { name: 'Level 1', class: 'retention-l1', intervalDays: 1 };
    }
  }

  function isReviewDue(concept) {
    if (concept.level >= 4) return false;
    const meta = getLevelMeta(concept.level);
    const requiredIntervalMs = meta.intervalDays * 86400000;
    return (Date.now() - (concept.lastReviewed || 0)) >= requiredIntervalMs;
  }

  // =========================================================================
  // Render: All Concepts (Tab 1)
  // =========================================================================
  let currentSubjectFilter = 'all';
  let currentSearchQuery = '';

  function renderConceptsGrid() {
    const grid = document.getElementById('concepts-grid');
    grid.innerHTML = '';

    const filtered = concepts.filter(c => {
      const matchSubject = currentSubjectFilter === 'all' || c.subject.toLowerCase() === currentSubjectFilter.toLowerCase();
      const matchSearch = !currentSearchQuery || 
        c.title.toLowerCase().includes(currentSearchQuery) ||
        c.feynmanExp.toLowerCase().includes(currentSearchQuery) ||
        c.rootCause.toLowerCase().includes(currentSearchQuery);
      return matchSubject && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">No concepts found matching your query.</p>
          <small>Click <strong>"+ Learn New Concept"</strong> to add a new fundamental principle!</small>
        </div>
      `;
      return;
    }

    filtered.forEach(c => {
      const card = document.createElement('div');
      card.className = 'concept-card';

      const tagClass = getSubjectTagClass(c.subject);
      const levelMeta = getLevelMeta(c.level);
      const due = isReviewDue(c);

      card.innerHTML = `
        <div class="concept-card-header">
          <span class="subject-tag ${tagClass}">${c.subject}</span>
          <span class="retention-badge ${levelMeta.class}">
            ${due ? '⚠️ Due for Review' : levelMeta.name}
          </span>
        </div>

        <h3 class="concept-title">${c.title}</h3>

        <div class="feynman-box">
          <span class="box-label">👦 10-YEAR-OLD FEYNMAN EXPLANATION</span>
          <p>${c.feynmanExp}</p>
        </div>

        <div class="analogy-box">
          <strong>🌍 Everyday Example:</strong> ${c.analogy}
        </div>

        <div class="analogy-box" style="border-left: 2px solid var(--color-purple);">
          <strong>⚡ First Principles Root:</strong> ${c.rootCause}
        </div>

        <div class="concept-footer">
          <span>Formula: ${c.bookDef.slice(0, 32)}...</span>
          <button class="btn-review-mini" data-id="${c.id}">
            ${due ? '⚡ Review Now' : 'Quick Review'}
          </button>
        </div>
      `;

      card.querySelector('.btn-review-mini').addEventListener('click', () => {
        startQuizWithSingle(c.id);
      });

      grid.appendChild(card);
    });
  }

  function getSubjectTagClass(subject) {
    const s = subject.toLowerCase();
    if (s.includes('physics')) return 'tag-physics';
    if (s.includes('computer')) return 'tag-cs';
    if (s.includes('math')) return 'tag-math';
    if (s.includes('chemistry')) return 'tag-chem';
    return 'tag-general';
  }

  // =========================================================================
  // Render: Spaced Memory Vault (Tab 2)
  // =========================================================================
  function renderSpacedVault() {
    const listL1 = document.getElementById('list-l1');
    const listL2 = document.getElementById('list-l2');
    const listL3 = document.getElementById('list-l3');
    const listMastered = document.getElementById('list-mastered');

    listL1.innerHTML = '';
    listL2.innerHTML = '';
    listL3.innerHTML = '';
    listMastered.innerHTML = '';

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };

    concepts.forEach(c => {
      const lvl = Math.min(Math.max(c.level, 1), 4);
      counts[lvl]++;

      const card = document.createElement('div');
      card.className = 'stage-card-mini';
      const due = isReviewDue(c);

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.65rem; color: #94a3b8; font-family: var(--font-mono);">${c.subject.toUpperCase()}</span>
          ${due ? '<span style="color: var(--color-rose); font-size: 0.65rem; font-weight: bold;">● DUE</span>' : ''}
        </div>
        <strong>${c.title}</strong>
        <p style="font-size: 0.75rem; color: #94a3b8; line-height: 1.3;">${c.feynmanExp.slice(0, 75)}...</p>
      `;

      card.addEventListener('click', () => {
        startQuizWithSingle(c.id);
      });

      if (lvl === 1) listL1.appendChild(card);
      else if (lvl === 2) listL2.appendChild(card);
      else if (lvl === 3) listL3.appendChild(card);
      else listMastered.appendChild(card);
    });

    document.getElementById('count-l1').innerText = counts[1];
    document.getElementById('count-l2').innerText = counts[2];
    document.getElementById('count-l3').innerText = counts[3];
    document.getElementById('count-mastered').innerText = counts[4];
  }

  // =========================================================================
  // Active Recall Quiz Arena (Tab 3)
  // =========================================================================
  let quizQueue = [];
  let currentQuizIndex = 0;

  function initActiveRecall() {
    const btnStart = document.getElementById('btn-start-quiz');
    const welcomeCard = document.getElementById('recall-welcome');
    const activeCard = document.getElementById('recall-active-card');
    const btnReveal = document.getElementById('btn-reveal-answer');
    const gradeButtons = document.getElementById('quiz-grade-buttons');
    const answerBox = document.getElementById('quiz-answer-box');

    const btnForgot = document.getElementById('btn-quiz-forgot');
    const btnRemembered = document.getElementById('btn-quiz-remembered');

    btnStart.addEventListener('click', () => {
      quizQueue = [...concepts];
      if (quizQueue.length === 0) {
        showToast('Add some concepts first!');
        return;
      }
      currentQuizIndex = 0;
      welcomeCard.style.display = 'none';
      activeCard.style.display = 'block';
      loadQuizCard();
    });

    btnReveal.addEventListener('click', () => {
      answerBox.style.display = 'flex';
      btnReveal.style.display = 'none';
      gradeButtons.style.display = 'flex';
    });

    btnForgot.addEventListener('click', () => {
      handleQuizAnswer(false);
    });

    btnRemembered.addEventListener('click', () => {
      handleQuizAnswer(true);
    });
  }

  function startQuizWithSingle(conceptId) {
    const target = concepts.find(c => c.id === conceptId);
    if (!target) return;

    // Switch to recall tab
    switchTab('recall');
    quizQueue = [target];
    currentQuizIndex = 0;
    document.getElementById('recall-welcome').style.display = 'none';
    document.getElementById('recall-active-card').style.display = 'block';
    loadQuizCard();
  }

  function loadQuizCard() {
    const c = quizQueue[currentQuizIndex];
    if (!c) {
      // Completed Session
      document.getElementById('recall-active-card').style.display = 'none';
      document.getElementById('recall-welcome').style.display = 'flex';
      document.getElementById('recall-welcome').innerHTML = `
        <div class="arena-icon">🎉</div>
        <h2>Recall Session Complete!</h2>
        <p>You have actively strengthened your neural synapses. Concepts reviewed are now locked deeper into long-term memory.</p>
        <button class="btn-highlight btn-large" id="btn-restart-quiz">Review More Concepts</button>
      `;
      document.getElementById('btn-restart-quiz').addEventListener('click', () => {
        location.reload();
      });
      audio.playSuccessChime();
      return;
    }

    document.getElementById('quiz-subject').innerText = c.subject;
    document.getElementById('quiz-progress-text').innerText = `Card ${currentQuizIndex + 1} of ${quizQueue.length}`;
    document.getElementById('quiz-title').innerText = c.title;

    document.getElementById('quiz-feynman-ans').innerText = c.feynmanExp;
    document.getElementById('quiz-analogy-ans').innerText = c.analogy;
    document.getElementById('quiz-root-ans').innerText = c.rootCause;

    // Reset card state
    document.getElementById('quiz-answer-box').style.display = 'none';
    document.getElementById('btn-reveal-answer').style.display = 'block';
    document.getElementById('quiz-grade-buttons').style.display = 'none';
  }

  function handleQuizAnswer(remembered) {
    const c = quizQueue[currentQuizIndex];
    const original = concepts.find(item => item.id === c.id);

    if (original) {
      if (remembered) {
        // Upgrade stage
        original.level = Math.min((original.level || 1) + 1, 4);
        original.lastReviewed = Date.now();
        showToast(`✅ Synapse Strengthened! Level ${original.level}`);
        audio.playSuccessChime();
      } else {
        // Reset to Level 1 for immediate re-learning
        original.level = 1;
        original.lastReviewed = Date.now();
        showToast('⚠️ Reset to Level 1: Will review again tomorrow!');
      }
      saveConcepts();
      renderConceptsGrid();
      renderSpacedVault();
    }

    currentQuizIndex++;
    loadQuizCard();
  }

  // =========================================================================
  // Global Metrics & UI Handlers
  // =========================================================================
  function updateMetrics() {
    const total = concepts.length;
    const dueCount = concepts.filter(isReviewDue).length;
    const masteredCount = concepts.filter(c => c.level >= 4).length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-due').innerText = dueCount;
    document.getElementById('stat-mastered').innerText = masteredCount;

    const badge = document.getElementById('tab-due-badge');
    if (badge) badge.innerText = dueCount;
  }

  function switchTab(tabKey) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabKey}`);
    });
    if (tabKey === 'spaced') renderSpacedVault();
  }

  function initUI() {
    // Mode Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Subject Filter Chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentSubjectFilter = chip.dataset.subject;
        renderConceptsGrid();
      });
    });

    // Search Input Real-Time
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', e => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderConceptsGrid();
    });

    // Study Sound Toggle
    const btnSound = document.getElementById('btn-toggle-sound');
    btnSound.addEventListener('click', () => {
      const on = audio.toggle();
      btnSound.classList.toggle('active', on);
      showToast(on ? '🎵 432Hz Study Ambience Active' : '🔇 Audio Muted');
    });

    // New Concept Modal
    const btnAdd = document.getElementById('btn-add-concept');
    const modal = document.getElementById('concept-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('concept-form');

    const openModal = () => {
      modal.classList.add('active');
      document.getElementById('form-title').focus();
    };
    const closeModal = () => modal.classList.remove('active');

    btnAdd.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('form-title').value.trim();
      const subject = document.getElementById('form-subject').value;
      const bookDef = document.getElementById('form-book-def').value.trim();
      const feynmanExp = document.getElementById('form-feynman-exp').value.trim();
      const analogy = document.getElementById('form-analogy').value.trim();
      const rootCause = document.getElementById('form-root-cause').value.trim();

      if (!title || !feynmanExp) return;

      const newConcept = {
        id: 'c-' + Date.now(),
        title,
        subject,
        bookDef,
        feynmanExp,
        analogy,
        rootCause,
        level: 1, // Freshly learned, due tomorrow
        lastReviewed: Date.now(),
        created: Date.now()
      };

      concepts.unshift(newConcept);
      saveConcepts();
      renderConceptsGrid();
      renderSpacedVault();
      closeModal();
      form.reset();

      audio.playSuccessChime();
      showToast(`⚛ "${title}" Deconstructed & Saved!`);
    });

    initPomodoro();
    initActiveRecall();
    renderConceptsGrid();
    renderSpacedVault();
    updateMetrics();
  }

  function showToast(msg) {
    const hub = document.getElementById('toast-hub');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    hub.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  window.addEventListener('DOMContentLoaded', initUI);
})();
