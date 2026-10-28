import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Topic Content ────────────────────────────────────────────────────────────
const TOPIC_DB = {
  'ER Model & Diagrams': {
    color: '#a78bfa', bg: 'linear-gradient(135deg,#0d0820 0%,#1a0d38 50%,#0d0820 100%)',
    icon: '🗺️',
    realWorld: {
      tagline: 'Every app you use was designed with ER diagrams before writing a single line of code.',
      apps: [
        { name: 'WhatsApp', emoji: '💬', fact: 'User ↔ Message ↔ Group. This ER diagram was drawn in 2009. Still runs today.' },
        { name: 'Zomato', emoji: '🍕', fact: 'Restaurant ↔ Menu ↔ Order ↔ Customer. Every delivery you track = ER model in action.' },
        { name: 'Your College ERP', emoji: '🎓', fact: 'Student enrolls in Course taught by Faculty. Your exam result system is literally this ER diagram.' },
        { name: 'Amazon', emoji: '📦', fact: 'Customer → Order → Product → Seller. 1995 design still powers 300 million products.' },
      ],
    },
    story: {
      title: 'Why a blueprint before building?',
      lines: [
        "Imagine building a 10-floor hospital without any blueprint.",
        "You start building rooms... but forget to plan where the pipes go.",
        "Floor 7 is done — then you realize: the ICU and pharmacy are on opposite ends.",
        "You tear down walls. Waste crores. Miss the deadline.",
        "",
        "An ER Diagram is the blueprint of a database.",
        "It answers: What are the THINGS (entities)? What are their PROPERTIES (attributes)?",
        "How are they CONNECTED (relationships)? How many connect to how many (cardinality)?",
        "",
        "Every app you use — WhatsApp, Instagram, your bank — was designed on paper first.",
        "The ER diagram IS that paper.",
      ],
      keyInsight: '🏗️ ER Model = Database blueprint. Build it first, code later.',
    },
    memory: [
      { label: 'Rectangle = Entity', trick: 'A thing that can EXIST independently. Student, Book, Hospital. If it can stand alone → Rectangle.' },
      { label: 'Ellipse = Attribute', trick: 'Properties of an entity. Student has: Name, RollNo, Age. Dashed ellipse = derived (Age from DOB).' },
      { label: 'Diamond = Relationship', trick: '"Studies" connects Student and Subject. Diamonds are always VERBS (action words).' },
      { label: 'Cardinality', trick: '1:1 = marriage (one person, one Aadhaar). 1:N = mother-children. M:N = student-courses.' },
      { label: 'Double Line = MUST', trick: 'Double line = total participation = COMPULSORY. Every employee MUST work in some department. Single line = optional.' },
    ],
    quiz: {
      q: 'A library system has Books and Members. A member can borrow multiple books, and a book can be borrowed by multiple members. What is the cardinality?',
      options: ['1:1', '1:N', 'M:N', 'N:1'],
      answer: 2,
      explain: 'M:N — One member borrows many books AND one book is borrowed by many members. This creates a separate BORROWING table with date attribute.',
    },
  },

  'Normalization (1NF-BCNF)': {
    color: '#f472b6', bg: 'linear-gradient(135deg,#150510 0%,#2d0a1f 50%,#150510 100%)',
    icon: '⚗️',
    realWorld: {
      tagline: 'Normalization is why your bank account never shows the wrong balance.',
      apps: [
        { name: 'UPI / Banking', emoji: '💸', fact: 'Update address once → all accounts reflect it. Without normalization: update 500 rows, miss one, bank has wrong info.' },
        { name: 'Zomato', emoji: '🍕', fact: 'Dish price stored in ONE row. All past + future orders reference it. Change once → works everywhere.' },
        { name: 'CBSE Results', emoji: '📋', fact: '10 million students. Unnormalized = data duplicated millions of times. Normalization: each fact stored ONCE.' },
        { name: 'Your College ERP', emoji: '🎓', fact: 'Student enrolled in 6 subjects. Their name stored once (not 6 times). Change name = 1 update, not 6.' },
      ],
    },
    story: {
      title: 'The Messy Register Problem',
      lines: [
        "Your teacher keeps ONE register for everything:",
        "",
        "  StudentID | Name  | CourseID | CourseName | Grade",
        "  S1        | Ravi  | C1       | Maths      | A",
        "  S1        | Ravi  | C2       | Science    | B",
        "  S2        | Priya | C1       | Maths      | A+",
        "",
        "Problem 1 — Update: Ravi changes his name. Update 2 rows. Miss one → inconsistent data.",
        "Problem 2 — Insert: Can't add a new course without a student in it.",
        "Problem 3 — Delete: Delete Priya's record → lose that Maths course C1 exists.",
        "",
        "These are called ANOMALIES — the exact problems normalization FIXES.",
        "",
        "Solution: Split into 3 tables.",
        "Student(SID, Name) | Course(CID, CName) | Enrollment(SID, CID, Grade)",
        "",
        "Now Ravi's name is stored ONCE. One update. Zero anomalies.",
      ],
      keyInsight: '📌 One fact, one place. That is the entire philosophy of normalization.',
    },
    memory: [
      { label: '1NF → Atomic', trick: '"One cell = one value." No {Maths, Science} in one cell. No repeating groups. Think: each spreadsheet cell has exactly ONE thing.' },
      { label: '2NF → Full Key', trick: 'ONLY matters when primary key is COMPOSITE. Every non-key attribute must depend on the FULL key, not just part of it.' },
      { label: '3NF → No Middleman', trick: 'A→B→C where B is non-key = violation. City depends on ZipCode depends on StudentID = transitive = 3NF violation.' },
      { label: 'BCNF → Super Key Rule', trick: 'For EVERY functional dependency X→Y: X must be a SUPER KEY. No exceptions. Stricter than 3NF.' },
      { label: '🧠 Mnemonic', trick: '"1 Atom, 2 Full, 3 Direct, B Super" — say it out loud 5 times right now.' },
    ],
    quiz: {
      q: 'Table: Order(OrderID, ProductID, ProductName, Qty). FDs: OrderID+ProductID→Qty, ProductID→ProductName. What NF is violated?',
      options: ['1NF (not atomic)', '2NF (partial dependency)', '3NF (transitive dependency)', 'BCNF only'],
      answer: 1,
      explain: 'ProductName depends on ProductID alone — which is PART of the composite key (OrderID+ProductID). This partial dependency violates 2NF. Fix: Product(ProductID, ProductName) + OrderItem(OrderID, ProductID, Qty).',
    },
  },

  'SQL Joins & Subqueries': {
    color: '#60a5fa', bg: 'linear-gradient(135deg,#040d1f 0%,#0a1a38 50%,#040d1f 100%)',
    icon: '🔗',
    realWorld: {
      tagline: 'Every time you open an app, dozens of JOIN queries run in the background.',
      apps: [
        { name: 'Netflix Homepage', emoji: '🎬', fact: 'User JOIN Watch_History JOIN Movies → "You watched crime dramas, here are 10 more." Runs millions of times/day.' },
        { name: 'Your Order Summary', emoji: '📦', fact: 'Order JOIN Product JOIN Customer JOIN Address → that one page is a 4-table JOIN query.' },
        { name: 'Salary Slip', emoji: '💰', fact: 'Employee JOIN Department JOIN Salary_Grade → generated by a JOIN query every month end.' },
        { name: 'Google Analytics', emoji: '📊', fact: 'Every dashboard widget = a different JOIN + GROUP BY. Data analysts write these all day.' },
      ],
    },
    story: {
      title: 'Two notebooks, one answer',
      lines: [
        "Your school has two notebooks:",
        "",
        "  📗 Attendance: RollNo | StudentName",
        "  📘 Marks:      RollNo | Subject | Marks",
        "",
        "Principal asks: 'Show me names with their marks.'",
        "",
        "You match them manually by RollNo.",
        "That matching — is exactly what a JOIN does.",
        "",
        "INNER JOIN  → Only students who appear in BOTH books.",
        "LEFT JOIN   → All attendance book students.",
        "             (Even if they missed the exam → marks = NULL)",
        "FULL JOIN   → Everyone from both books.",
        "",
        "SQL is just telling the computer which matching to do.",
        "The concept is identical to what you'd do manually.",
      ],
      keyInsight: '🔗 JOIN = matching two lists on a common column. Exactly what you do manually.',
    },
    memory: [
      { label: 'INNER JOIN = Intersection', trick: 'Only rows where BOTH tables match. Venn diagram CENTER only. Most common join.' },
      { label: 'LEFT JOIN = Left Boss', trick: 'ALL rows from left table. Right side gets NULL if no match. Left table never loses rows.' },
      { label: 'NULL Pattern', trick: '"Find records with NO match" = LEFT JOIN + WHERE right.column IS NULL. Memorize this forever.' },
      { label: 'Correlated Subquery', trick: 'Uses a column from the outer query. Runs ONCE PER ROW = slow. Non-correlated = runs once = fast. Always prefer non-correlated or JOIN.' },
      { label: 'GROUP BY + JOIN', trick: 'JOIN first, then GROUP BY. SELECT dept, AVG(salary) → JOIN then GROUP. This pattern = 80% of analytics queries.' },
    ],
    quiz: {
      q: 'Find employees who have NOT been assigned to any project. Tables: Employee(EmpID, Name), Assignment(EmpID, ProjectID). Which query works?',
      options: [
        'SELECT Name FROM Employee WHERE EmpID NOT IN (SELECT EmpID FROM Assignment)',
        'SELECT Name FROM Employee INNER JOIN Assignment ON Employee.EmpID = Assignment.EmpID',
        'SELECT Name FROM Employee LEFT JOIN Assignment ON Employee.EmpID = Assignment.EmpID WHERE Assignment.EmpID IS NULL',
        'Both A and C',
      ],
      answer: 3,
      explain: 'Both A (NOT IN subquery) and C (LEFT JOIN + IS NULL) work correctly. In practice, option C (LEFT JOIN) is faster on large tables. Both are valid and may appear in exams — know both patterns.',
    },
  },

  'Transaction Management': {
    color: '#34d399', bg: 'linear-gradient(135deg,#021a0d 0%,#053d1e 50%,#021a0d 100%)',
    icon: '🔒',
    realWorld: {
      tagline: 'Transactions are why ₹500 never disappears mid-transfer.',
      apps: [
        { name: 'UPI Transfer', emoji: '💸', fact: 'Debit your account + Credit receiver = ONE transaction. Network dies mid-way? ROLLBACK. Both happen or neither. ACID at work.' },
        { name: 'Flight Booking', emoji: '✈️', fact: 'Seat reserved + payment charged + ticket issued = one transaction. Payment fails → seat auto-released. No orphan reservations.' },
        { name: 'Online Exam', emoji: '📝', fact: 'Your answer saves + timer updates + score calculates = transaction. System crash mid-save? Your answer isn\'t lost halfway.' },
        { name: 'Flipkart Flash Sale', emoji: '🛒', fact: '50,000 people click Buy on 1 item. Concurrency control ensures EXACTLY one person gets it. No overselling. EVER.' },
      ],
    },
    story: {
      title: 'The ATM Power Cut',
      lines: [
        "You insert card. ATM begins withdrawal.",
        "Step 1: Deduct ₹2000 from your account. ✓",
        "--- POWER CUTS ---",
        "Step 2: Dispense cash. ✗ Never happened.",
        "",
        "Without transactions: ₹2000 gone. No cash. You cry.",
        "",
        "With ACID transactions:",
        "  ATOMICITY: Both steps = one unit. All succeed or ALL fail.",
        "  Power cuts after debit, before dispense?",
        "  → ROLLBACK. ₹2000 returns to your account.",
        "",
        "CONSISTENCY: Rules never break. Balance never goes negative.",
        "ISOLATION:   Your withdrawal doesn't interfere with others.",
        "DURABILITY:  Once confirmed → permanent, even if server crashes.",
        "",
        "In 30 years of ATMs, your money has never truly disappeared.",
        "That is ACID. That is why people trust digital money.",
      ],
      keyInsight: '⚡ ACID = a promise: "I complete ALL steps, or I undo ALL steps. No in-between."',
    },
    memory: [
      { label: 'ACID Mnemonic', trick: '"A bank transaction must be ACID." Atomicity=all-or-nothing, Consistency=rules-preserved, Isolation=concurrent≡serial, Durability=committed=permanent.' },
      { label: '2PL — Two Phases', trick: '"Grow then Shrink." First only ACQUIRE locks. Then only RELEASE locks. Once you release ONE lock, you can NEVER acquire another. Like airport check-in: once luggage checked, can\'t add more.' },
      { label: 'Deadlock = Cycle', trick: 'Build Wait-For graph. A waits for B → B waits for A → cycle = DEADLOCK. No cycle = no deadlock. Simple graph problem.' },
      { label: 'Serializability', trick: 'Build precedence graph from conflicts (W-R, R-W, W-W). No cycle = conflict serializable = safe schedule.' },
      { label: 'Undo vs Redo', trick: '"Undo the uncommitted, Redo the committed." After crash: Undo transactions not yet committed. Redo transactions that committed but weren\'t flushed to disk.' },
    ],
    quiz: {
      q: 'Schedule: T1:R(A), T2:R(A), T1:W(A), T2:W(A). Build precedence graph. Is it conflict serializable?',
      options: [
        'Yes — no conflicts exist in this schedule',
        'Yes — precedence graph has no cycle',
        'No — precedence graph has a cycle (T1→T2 and T2→T1)',
        'Cannot determine without knowing data values',
      ],
      answer: 2,
      explain: 'T1:W(A) conflicts with T2:R(A) → T2 read before T1 write → edge T2→T1. T1:W(A) conflicts with T2:W(A) → T1 writes before T2 → edge T1→T2. Result: cycle T1→T2→T1 = NOT conflict serializable.',
    },
  },

  'TCP/IP Protocol Stack': {
    color: '#fbbf24', bg: 'linear-gradient(135deg,#150e00 0%,#2d1f00 50%,#150e00 100%)',
    icon: '🌐',
    realWorld: {
      tagline: 'TCP/IP is the reason this app is talking to you right now.',
      apps: [
        { name: 'YouTube Video', emoji: '📺', fact: 'Your video = HTTP (App) → TCP (Transport, no buffering) → IP (Network, 15 routers) → WiFi (DataLink) → screen. Every second.' },
        { name: 'PUBG Gaming', emoji: '🎮', fact: 'Uses UDP — no delivery guarantee, ultra-fast. One missed packet = tiny glitch (not freeze). Speed over reliability.' },
        { name: 'Email', emoji: '📧', fact: 'SMTP (send) and IMAP (receive) are Application Layer. They sit on top of TCP — every byte guaranteed to arrive.' },
        { name: 'Every Website', emoji: '🌐', fact: 'Type google.com → DNS (UDP) finds 142.250.x.x → TCP handshake → HTTPS (TLS) → page loads. All in under 100ms.' },
      ],
    },
    story: {
      title: 'You are a letter being sent',
      lines: [
        "Imagine you're a very long message being sent to a friend.",
        "",
        "✂️  POST OFFICE cuts you into 10 pieces, numbers them.",
        "   → This is TCP (Transport Layer): sequence numbers, acknowledgment.",
        "",
        "📬  Each piece gets an ENVELOPE with TO and FROM address.",
        "   → This is IP (Network Layer): source and destination IP.",
        "",
        "🚚  LOCAL POSTMAN delivers to the right house in the area.",
        "   → This is Data Link Layer: MAC address, last-mile delivery.",
        "",
        "📝  The ORIGINAL MESSAGE you wrote.",
        "   → This is Application Layer: HTTP, SMTP, FTP.",
        "",
        "TCP = Registered Post (acknowledgment, guaranteed, ordered).",
        "UDP = Speed Post (fast, no guarantee, no tracking).",
        "",
        "Your laptop is a post office processing 10,000 packets per second.",
      ],
      keyInsight: '📮 Each layer adds its own envelope (encapsulation). Receiver removes them layer by layer.',
    },
    memory: [
      { label: 'Layer Mnemonic (TCP/IP)', trick: '"A Tasty Network Delivers" → Application, Transport, Network, Data Link. Four layers, remember top to bottom.' },
      { label: 'TCP vs UDP', trick: '"TCP = Phone call (connection, ordered, guaranteed). UDP = Postcard (fast, fire-forget)." Voice calls use UDP — one lost packet = tiny crackle, not silence.' },
      { label: '3-Way Handshake', trick: '"SYN → SYN-ACK → ACK" = "Hello?" → "Hello! I heard you." → "Great!" Client→Server→Client. Connection in 3 steps.' },
      { label: 'Port Numbers', trick: 'HTTP=80, HTTPS=443, FTP=21, SSH=22, DNS=53, SMTP=25. "HTTP eighty, HTTPS four-forty-three" — say it like a chant.' },
      { label: 'IP vs MAC', trick: '"IP = home address (logical, can change). MAC = Aadhaar (physical, permanent)." IP routes to the city. MAC delivers to the exact door.' },
    ],
    quiz: {
      q: 'A packet travels from your browser to a web server. At which layer is the "source IP address" and "destination IP address" added to the packet?',
      options: ['Application Layer (HTTP)', 'Transport Layer (TCP)', 'Network Layer (IP)', 'Data Link Layer (Ethernet)'],
      answer: 2,
      explain: 'Network Layer (IP Layer) adds source and destination IP addresses. Transport Layer adds port numbers. Data Link adds MAC addresses. Application layer has the actual HTTP data.',
    },
  },

  'Process Scheduling': {
    color: '#f87171', bg: 'linear-gradient(135deg,#150505 0%,#2d0a0a 50%,#150505 100%)',
    icon: '⚙️',
    realWorld: {
      tagline: 'Process Scheduling is why your phone runs 50 apps without freezing.',
      apps: [
        { name: 'Your Smartphone', emoji: '📱', fact: 'WhatsApp, Spotify, Maps all "running." OS gives each a few milliseconds, cycling through them. So fast it feels parallel. Round Robin.' },
        { name: 'AWS Cloud Server', emoji: '☁️', fact: 'Thousands of users\' requests hit one server. Priority scheduling: premium users get faster response. Your free tier waits longer.' },
        { name: 'Office Printer Queue', emoji: '🖨️', fact: 'Multiple print jobs arrive. SJF: 1-page docs print first. Your 500-page report waits. Average queue time = minimum.' },
        { name: 'Video Editing', emoji: '🎬', fact: 'Render job gets HIGH CPU priority (foreground). Background backup gets LOW priority. Priority scheduling decides the split.' },
      ],
    },
    story: {
      title: 'The Chai Tapri Queue',
      lines: [
        "A chai tapri (tea stall) with ONE stove and 5 customers:",
        "",
        "  A: wants 1 chai       → 2 minutes",
        "  B: wants chai+snacks  → 10 minutes",
        "  C: wants 1 chai       → 2 minutes",
        "  D: special order      → 15 minutes",
        "  E: wants 1 chai       → 2 minutes",
        "",
        "FCFS (First Come First Served): A, B, C, D, E",
        "  C and E wait 12 minutes for a 2-minute order.",
        "  Average wait = terrible. Customers angry.",
        "",
        "SJF (Shortest Job First): A, C, E, B, D",
        "  Short orders done first. Average wait = MINIMUM.",
        "  Mathematically optimal for average waiting time.",
        "",
        "Round Robin (2 min turns): A, B, C, B, D, E, B, D, D",
        "  Everyone gets served progressively. Fair.",
        "",
        "Your OS does this EXACT decision 1000 times per second.",
      ],
      keyInsight: '⚙️ The OS scheduler = a smart tapri owner deciding whose order to take next, every millisecond.',
    },
    memory: [
      { label: 'FCFS = Convoy Effect', trick: 'One slow process blocks all fast ones. Like one person doing 100 photocopies while 10 people wait for 1 copy each.' },
      { label: 'SJF = Optimal WT', trick: '"SJF gives MINIMUM average waiting time." This is a theorem — write it in every exam that asks "which is optimal."' },
      { label: 'Key Formulas', trick: 'TAT = Completion − Arrival. WT = TAT − Burst. Response = First_CPU_Start − Arrival. DRAW GANTT CHART FIRST, then formulas are mechanical.' },
      { label: 'Round Robin tip', trick: 'Higher quantum → becomes FCFS. Lower quantum → too many context switches. Sweet spot: 80% of processes complete within one quantum.' },
      { label: 'Starvation fix', trick: '"Aging" = gradually increase priority of waiting processes. Standard answer for "how to fix starvation in priority scheduling."' },
    ],
    quiz: {
      q: 'Processes: P1(Arr=0,Burst=8), P2(Arr=1,Burst=4), P3(Arr=2,Burst=9), P4(Arr=3,Burst=5). SJF Non-Preemptive. What is the average waiting time?',
      options: ['5.25 ms', '7.75 ms', '6.50 ms', '8.00 ms'],
      answer: 1,
      explain: 'Gantt: P1(0-8), P2(8-12), P4(12-17), P3(17-26). WT: P1=0, P2=7, P3=15, P4=9. Average = (0+7+15+9)/4 = 31/4 = 7.75 ms. Key: at t=0 only P1 is ready, so P1 runs first (no choice). After t=8, choose shortest among P2(4), P3(9), P4(5) → P2 wins.',
    },
  },
};

function getTopicData(name) {
  return TOPIC_DB[name] || {
    color: '#a78bfa', bg: 'linear-gradient(135deg,#05050f 0%,#0d0d20 50%,#05050f 100%)',
    icon: '🌌',
    realWorld: {
      tagline: 'This topic has wide real-world applications across industries.',
      apps: [
        { name: 'Software Systems', emoji: '💻', fact: 'Core principles of this topic power most modern software architectures.' },
        { name: 'Databases', emoji: '🗄️', fact: 'Database design and querying relies heavily on these concepts.' },
        { name: 'Networks', emoji: '🌐', fact: 'Network communication protocols are built on these foundations.' },
        { name: 'Operating Systems', emoji: '🖥️', fact: 'OS internals use these principles for resource management.' },
      ],
    },
    story: {
      title: 'The Core Idea',
      lines: ['Every complex technical topic has a simple real-world analogy.', '', 'The goal is to find that analogy and anchor the concept to it.', '', 'Once you find the right analogy — you never forget the concept.'],
      keyInsight: '📌 Understand the WHY before memorizing the HOW.',
    },
    memory: [
      { label: 'Core Principle', trick: 'Identify the single most important rule of this topic. Everything else derives from it.' },
      { label: 'Real Analogy', trick: 'Find one everyday thing that works similarly. Your brain retains analogies better than definitions.' },
      { label: 'Teach It', trick: 'Explain to an imaginary student without notes. Gaps in explanation = gaps in understanding.' },
      { label: 'Draw It', trick: 'Sketch a diagram from memory. Visual + motor memory = stronger retention than reading alone.' },
      { label: 'Practice', trick: 'Solve 5 problems without looking at notes. Identifies exactly where gaps are.' },
    ],
    quiz: {
      q: 'What is the most effective way to learn a new technical concept?',
      options: ['Read the textbook three times', 'Understand through a real-world analogy, then practice problems', 'Memorize all definitions', 'Watch videos only'],
      answer: 1,
      explain: 'Understanding through analogy creates a mental anchor. Then practice problems expose gaps. This is the proven active-recall method used in all top learning systems.',
    },
  };
}

// ─── Particle Canvas Background ───────────────────────────────────────────────
function ParticleCanvas({ color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(p.a * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, [color]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ lines, color, onDone }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= lines.length) { onDone?.(); return; }
    const t = setTimeout(() => setShown((s) => s + 1), lines[shown] === '' ? 200 : 80 + lines[shown].length * 18);
    return () => clearTimeout(t);
  }, [shown, lines, onDone]);
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 14.5, lineHeight: 2, color: 'rgba(255,255,255,0.82)', maxWidth: 560 }}>
      {lines.slice(0, shown).map((line, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {line === '' ? <br /> : (
            <span style={{
              color: line.startsWith('  ') ? '#e2e8f0' : line.startsWith('→') || line.startsWith('FCFS') || line.startsWith('SJF') || line.startsWith('Round') ? color : 'rgba(255,255,255,0.82)',
              fontWeight: line.startsWith('  ') ? 500 : 'inherit',
            }}>
              {line}
            </span>
          )}
        </motion.div>
      ))}
      {shown < lines.length && <span style={{ color, animation: 'blink 0.8s infinite', fontWeight: 700 }}>▋</span>}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ─── Scene Components ─────────────────────────────────────────────────────────
function SceneRealWorld({ data, color }) {
  return (
    <div style={{ maxWidth: 720, width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p style={{ color, fontSize: 10, letterSpacing: 5, fontWeight: 700, marginBottom: 12, fontFamily: 'system-ui' }}>STATION 1 · REAL WORLD</p>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.35, marginBottom: 32, fontFamily: 'system-ui', textShadow: `0 0 30px ${color}50` }}>
          {data.tagline}
        </h2>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {data.apps.map((app, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}25`,
              borderRadius: 16, padding: '18px 18px',
              backdropFilter: 'blur(10px)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{app.emoji}</span>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'system-ui' }}>{app.name}</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12.5, lineHeight: 1.75, fontFamily: 'system-ui' }}>{app.fact}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SceneStory({ data, color, onDone }) {
  const [typeDone, setTypeDone] = useState(false);
  return (
    <div style={{ maxWidth: 620, width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color, fontSize: 10, letterSpacing: 5, fontWeight: 700, marginBottom: 10, fontFamily: 'system-ui' }}>STATION 2 · THE STORY</p>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 24, fontFamily: 'system-ui' }}>{data.title}</h2>
      </motion.div>
      <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: '20px 22px', borderLeft: `3px solid ${color}`, marginBottom: 20 }}>
        <Typewriter lines={data.lines} color={color} onDone={() => { setTypeDone(true); onDone?.(); }} />
      </div>
      {typeDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 12, padding: '12px 18px' }}>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.6, fontFamily: 'system-ui' }}>{data.keyInsight}</p>
        </motion.div>
      )}
    </div>
  );
}

function SceneMemory({ tricks, color, onDone }) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (revealed >= tricks.length) { onDone?.(); return; }
    const t = setTimeout(() => setRevealed((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [revealed, tricks.length, onDone]);
  return (
    <div style={{ maxWidth: 640, width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color, fontSize: 10, letterSpacing: 5, fontWeight: 700, marginBottom: 10, fontFamily: 'system-ui' }}>STATION 3 · MEMORY LOCK</p>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 24, fontFamily: 'system-ui' }}>Tricks that stick forever</h2>
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tricks.slice(0, revealed).map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -30, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 14,
              padding: '14px 18px', borderLeft: `3px solid ${color}88`,
              backdropFilter: 'blur(8px)',
            }}>
            <p style={{ color, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase', fontFamily: 'system-ui' }}>{t.label}</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.75, fontFamily: 'system-ui' }}>{t.trick}</p>
          </motion.div>
        ))}
        {revealed < tricks.length && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', padding: '8px', fontFamily: 'system-ui' }}>
            Loading next trick...
          </div>
        )}
      </div>
    </div>
  );
}

function SceneQuiz({ quiz, color, onPass }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = submitted && selected === quiz.answer;
  return (
    <div style={{ maxWidth: 620, width: '100%' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color, fontSize: 10, letterSpacing: 5, fontWeight: 700, marginBottom: 10, fontFamily: 'system-ui' }}>STATION 4 · FINAL CHALLENGE</p>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 6, fontFamily: 'system-ui' }}>Prove you've got it</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 24, fontFamily: 'system-ui' }}>Answer correctly to unlock your achievement badge.</p>
      </motion.div>
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: '18px 20px', marginBottom: 20, border: `1px solid ${color}30` }}>
        <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.75, fontFamily: 'system-ui' }}>{quiz.q}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {quiz.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.04)';
          let border = 'rgba(255,255,255,0.1)';
          let textColor = 'rgba(255,255,255,0.7)';
          if (selected === i && !submitted) { bg = `${color}22`; border = color; textColor = '#fff'; }
          if (submitted) {
            if (i === quiz.answer) { bg = 'rgba(52,211,153,0.18)'; border = '#34d399'; textColor = '#34d399'; }
            else if (selected === i) { bg = 'rgba(248,113,113,0.18)'; border = '#f87171'; textColor = '#f87171'; }
          }
          return (
            <motion.button key={i} whileHover={!submitted ? { scale: 1.01 } : {}} whileTap={!submitted ? { scale: 0.99 } : {}}
              onClick={() => !submitted && setSelected(i)}
              style={{
                background: bg, border: `1px solid ${border}`, borderRadius: 12,
                padding: '13px 18px', textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                color: textColor, fontSize: 13, lineHeight: 1.6, fontFamily: 'system-ui', fontWeight: 500,
                transition: 'all 0.2s',
              }}>
              <span style={{ marginRight: 10, fontWeight: 700, color: border }}>
                {submitted ? (i === quiz.answer ? '✓' : selected === i ? '✗' : `${['A','B','C','D'][i]}.`) : `${['A','B','C','D'][i]}.`}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </div>
      {!submitted && (
        <button onClick={() => selected !== null && setSubmitted(true)} style={{
          padding: '12px 28px', borderRadius: 12, cursor: selected !== null ? 'pointer' : 'not-allowed',
          background: selected !== null ? `${color}33` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${selected !== null ? color : 'rgba(255,255,255,0.1)'}`,
          color: selected !== null ? '#fff' : 'rgba(255,255,255,0.3)',
          fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: 'system-ui',
        }}>
          SUBMIT ANSWER
        </button>
      )}
      {submitted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ background: correct ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${correct ? '#34d399' : '#f87171'}44`, borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
            <p style={{ color: correct ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 800, marginBottom: 6, fontFamily: 'system-ui' }}>
              {correct ? '✓ Correct! Well done.' : '✗ Not quite — here\'s the explanation:'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12.5, lineHeight: 1.75, fontFamily: 'system-ui' }}>{quiz.explain}</p>
          </div>
          {correct ? (
            <motion.button whileHover={{ scale: 1.03 }} onClick={onPass}
              style={{ padding: '13px 32px', borderRadius: 12, cursor: 'pointer', background: `${color}33`, border: `1px solid ${color}`, color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 2, fontFamily: 'system-ui' }}>
              🏆 CLAIM BADGE →
            </motion.button>
          ) : (
            <button onClick={() => { setSelected(null); setSubmitted(false); }} style={{ padding: '12px 24px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, letterSpacing: 2, fontFamily: 'system-ui' }}>
              TRY AGAIN
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function SceneComplete({ topicName, color, icon, onExit }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 480 }}>
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        style={{ fontSize: 72, marginBottom: 20, filter: `drop-shadow(0 0 30px ${color})` }}>
        🏆
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <p style={{ color, fontSize: 10, letterSpacing: 5, fontWeight: 700, marginBottom: 12, fontFamily: 'system-ui' }}>MISSION COMPLETE</p>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 900, marginBottom: 8, fontFamily: 'system-ui' }}>
          {icon} {topicName}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28, fontFamily: 'system-ui', lineHeight: 1.6 }}>
          You've completed all 4 learning stations.<br />This topic is now locked in your memory.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          {['Real World', 'The Story', 'Memory Lock', 'Challenge'].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
              style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: 20, padding: '6px 14px', color: color, fontSize: 11, fontWeight: 700, fontFamily: 'system-ui' }}>
              ✓ {s}
            </motion.div>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onExit}
          style={{ padding: '14px 36px', borderRadius: 14, cursor: 'pointer', background: `${color}`, border: 'none', color: '#000', fontSize: 14, fontWeight: 900, letterSpacing: 1.5, fontFamily: 'system-ui' }}>
          EXIT UNIVERSE
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Portal Opening ───────────────────────────────────────────────────────────
function PortalOpening({ topicName, color }) {
  return (
    <motion.div key="portal" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}
      style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden' }}>
      {[60, 130, 220, 340, 500, 700].map((size, i) => (
        <motion.div key={i} style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `1px solid ${color}`, boxShadow: `0 0 20px ${color}40` }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.15, 1], opacity: [0, 0.9, 0.15 - i * 0.02] }}
          transition={{ delay: i * 0.11, duration: 1.8 }} />
      ))}
      <motion.div style={{ position: 'absolute', width: 32, height: 32, borderRadius: '50%', background: color, boxShadow: `0 0 80px 20px ${color}80` }}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 2.5, 1.2], opacity: [0, 1, 0.85] }} transition={{ duration: 1.4 }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', userSelect: 'none' }}>
        <motion.p style={{ fontSize: 10, letterSpacing: 7, fontWeight: 700, color: `${color}bb`, marginBottom: 14, fontFamily: 'system-ui' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>ENTERING</motion.p>
        <motion.h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 14, fontFamily: 'system-ui', textShadow: `0 0 40px ${color}`, maxWidth: 340, textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.85, type: 'spring', stiffness: 140, damping: 18 }}>
          {topicName}
        </motion.h1>
        <motion.p style={{ fontSize: 10, letterSpacing: 9, fontWeight: 700, color: `${color}88`, marginBottom: 36, fontFamily: 'system-ui' }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25 }}>LEARNING UNIVERSE</motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 180, height: 2, background: `${color}25`, borderRadius: 2, overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: color }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ delay: 0.55, duration: 2.1 }} />
          </div>
          <p style={{ fontSize: 9, letterSpacing: 4, color: `${color}55`, fontFamily: 'system-ui', fontWeight: 600 }}>4 LEARNING STATIONS LOADING...</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SCENE_LABELS = ['🌍 Real World', '🎭 The Story', '🧠 Memory Lock', '⚡ Challenge'];

export default function TopicVirtualWorld({ topic, onClose }) {
  const [phase, setPhase] = useState('portal');
  const [scene, setScene] = useState(0);
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);
  const [completed, setCompleted] = useState(false);
  const topicData = getTopicData(topic);

  useEffect(() => {
    const t = setTimeout(() => setPhase('world'), 2900);
    return () => clearTimeout(t);
  }, []);

  const handleUnlock = useCallback((idx) => {
    setUnlockedUpTo((prev) => Math.max(prev, idx + 1));
  }, []);

  const handleNext = () => {
    if (scene < 3) setScene((s) => s + 1);
    else setCompleted(true);
  };

  const handlePass = () => setCompleted(true);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const canProceed = unlockedUpTo > scene || scene === 3;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
      <AnimatePresence>
        {phase === 'portal' && <PortalOpening topicName={topic} color={topicData.color} />}
      </AnimatePresence>

      {phase === 'world' && !completed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }}
          style={{ position: 'absolute', inset: 0, background: topicData.bg, display: 'flex', flexDirection: 'column' }}>
          <ParticleCanvas color={topicData.color} />

          {/* Top bar */}
          <div style={{
            position: 'relative', zIndex: 2, padding: '14px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: 'rgba(255,255,255,0.06) 1px solid',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
            flexShrink: 0,
          }}>
            <div>
              <p style={{ color: `${topicData.color}88`, fontSize: 9, letterSpacing: 5, fontWeight: 700, fontFamily: 'system-ui', marginBottom: 2 }}>LEARNING UNIVERSE</p>
              <h2 style={{ color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'system-ui' }}>{topicData.icon} {topic}</h2>
            </div>

            {/* Progress steps */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {SCENE_LABELS.map((label, i) => (
                <button key={i} onClick={() => i <= unlockedUpTo && setScene(i)}
                  style={{
                    padding: '5px 10px', borderRadius: 20, cursor: i <= unlockedUpTo ? 'pointer' : 'not-allowed',
                    background: scene === i ? `${topicData.color}33` : i < scene ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${scene === i ? topicData.color : i < scene ? '#34d39944' : 'rgba(255,255,255,0.1)'}`,
                    color: scene === i ? '#fff' : i < scene ? '#34d399' : 'rgba(255,255,255,0.35)',
                    fontSize: 10, fontWeight: 700, fontFamily: 'system-ui', whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}>
                  {i < scene ? `✓ ${label}` : label}
                </button>
              ))}
            </div>

            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.7)', padding: '7px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: 'system-ui',
            }}>✕ EXIT</button>
          </div>

          {/* Scene content */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px', overflow: 'auto', position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              {scene === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <SceneRealWorld data={topicData.realWorld} color={topicData.color} />
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ marginTop: 28 }}>
                    {!canProceed && handleUnlock(0)}
                  </motion.div>
                </motion.div>
              )}

              {scene === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <SceneStory data={topicData.story} color={topicData.color} onDone={() => handleUnlock(1)} />
                </motion.div>
              )}

              {scene === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <SceneMemory tricks={topicData.memory} color={topicData.color} onDone={() => handleUnlock(2)} />
                </motion.div>
              )}

              {scene === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <SceneQuiz quiz={topicData.quiz} color={topicData.color} onPass={handlePass} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          {scene < 3 && (
            <div style={{
              position: 'relative', zIndex: 2, padding: '14px 28px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
              flexShrink: 0,
            }}>
              <AnimatePresence>
                {(unlockedUpTo > scene) && (
                  <motion.button key="next" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    style={{
                      padding: '11px 28px', borderRadius: 12, cursor: 'pointer',
                      background: `${topicData.color}`, border: 'none',
                      color: '#000', fontSize: 12, fontWeight: 900, letterSpacing: 2, fontFamily: 'system-ui',
                    }}>
                    NEXT STATION →
                  </motion.button>
                )}
                {unlockedUpTo <= scene && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, fontFamily: 'system-ui', letterSpacing: 2 }}>
                    Complete this station to continue...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Completion screen */}
      {phase === 'world' && completed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          style={{ position: 'absolute', inset: 0, background: topicData.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ParticleCanvas color={topicData.color} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <SceneComplete topicName={topic} color={topicData.color} icon={topicData.icon} onExit={onClose} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
