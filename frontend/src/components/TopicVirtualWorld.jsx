import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls, Html } from '@react-three/drei';

// ─── Deep Learning Content Database ──────────────────────────────────────────
const TOPIC_DB = {
  'ER Model & Diagrams': {
    color: '#a78bfa', icon: '🗺️', atmosphere: '#08051a',
    realWorld: {
      headline: 'ER Model powers every app you use daily',
      uses: [
        { app: '📱 WhatsApp', desc: 'User ↔ Message ↔ Group — ER model designed these relationships before a single line of code was written.' },
        { app: '🏥 Hospital Systems', desc: 'Doctor treats Patient, Patient has Records — ER diagram defines who stores what.' },
        { app: '🎓 College ERP', desc: 'Student enrolls in Course taught by Faculty — your exam result system is literally an ER diagram.' },
        { app: '🛒 E-Commerce', desc: 'Customer places Order containing Products — Amazon designed this ER diagram in 1995. It still runs today.' },
      ],
    },
    story: {
      headline: 'The School Attendance Problem',
      narrative: `Imagine your school keeps data in a big single sheet:\n\n"Ravi, Class 10A, Subject: Maths, Teacher: Mr. Sharma, Marks: 85"\n"Ravi, Class 10A, Subject: Science, Teacher: Mrs. Patel, Marks: 72"\n\nRavi's class is written 100 times. If Ravi changes section — you update 100 rows.\n\nAn ER diagram says: "Ravi is a STUDENT ENTITY. Class is a separate entity. They have a RELATIONSHIP — enrolled_in."\n\nResult: Ravi's data stored ONCE. Update once, correct everywhere.`,
      key: '📌 ER Model = blueprint drawn BEFORE building the database. Like an architect draws a map before constructing a building.',
    },
    memory: {
      tricks: [
        { label: 'Entity vs Attribute', trick: 'If it can exist independently → Entity. If it only makes sense with something else → Attribute. "Phone number" alone means nothing → Attribute of Person.' },
        { label: 'Weak Entity', trick: 'Can\'t survive alone — needs a parent. A "Room" needs a "Building". Room number 101 exists in every building! Remove the building → room has no meaning.' },
        { label: 'Cardinality Trick', trick: '"One teacher teaches MANY students. One student has ONE roll number." → 1:N and 1:1. Draw arrows → the arrow tip side is the "many" side.' },
        { label: 'Double Line = Total', trick: 'Double line = MUST participate. Like: every employee MUST work in some department (total). But not every department has a manager (partial = single line).' },
        { label: 'Exam Trick', trick: 'Whenever you see "many-to-many" → always create a separate JOIN TABLE. This is 90% of M:N questions in exams.' },
      ],
    },
    study: {
      steps: [
        'Day 1: Draw ER for 3 real apps (WhatsApp, Swiggy, your college). Don\'t study theory first — draw first.',
        'Day 2: Learn notation — rectangles (entity), ellipses (attribute), diamonds (relationship), lines (participation).',
        'Day 3: Practice converting ER → Tables. This is what exams test most.',
        'Day 4: Solve 10 MCQs. Most common trap: identifying weak entities and total participation.',
        'Final trick: In exam, always label cardinality first (1:1, 1:N, M:N) before drawing anything.',
      ],
      timeEstimate: '4 days to exam-ready level',
      examWeight: 'Medium-High — 1-2 marks, but foundational for Normalization questions',
    },
    apply: {
      scenario: 'Design ER for a Library:\n- A Library has Books\n- Members can borrow Books\n- Each Book has an Author',
      question: 'Identify: entities, attributes, relationships, cardinality, and any weak entities.',
      answer: 'Entities: Library, Book, Member, Author\nRelationship: Member "borrows" Book (M:N → creates Borrowing table with date)\nRelationship: Book "written_by" Author (M:N — one book can have multiple authors)\nKey insight: "Borrowing" is itself an entity (it has a date attribute) — called an ASSOCIATIVE ENTITY.',
      examTip: '🎯 If a relationship has its own attributes (like date of borrowing) — make it an entity. This is the most common 2-mark question.',
    },
  },

  'Normalization (1NF-BCNF)': {
    color: '#f472b6', icon: '⚗️', atmosphere: '#150510',
    realWorld: {
      headline: 'Normalization is why your bank account never shows wrong balance',
      uses: [
        { app: '🏦 Banking', desc: 'Account, Customer, Branch are separate normalized tables. Update your address once — all accounts reflect it instantly.' },
        { app: '📱 Zomato', desc: 'Restaurant, Menu, Order, Customer are all normalized. Change a dish price in one row — every future order sees the new price.' },
        { app: '🎓 CBSE Results', desc: 'Student, Subject, Marks separated. If they stored everything in one table, correcting one student\'s marks could corrupt others.' },
        { app: '🏥 Aarogya Setu', desc: 'Patient data normalized across hospitals. Visit any hospital — your records are consistent because there\'s ONE source of truth.' },
      ],
    },
    story: {
      headline: 'The Messy Register Problem',
      narrative: `Your teacher keeps ONE register with columns:\nStudentID | Name | CourseID | CourseName | Grade\n\nS1 | Ravi | C1 | Maths | A\nS1 | Ravi | C2 | Science | B\nS2 | Priya | C1 | Maths | A+\n\nPROBLEMS:\n• Ravi's name appears twice → Update Anomaly (change name → update all rows)\n• Can't add a new course without a student → Insertion Anomaly\n• Delete Priya → lose that Maths course exists → Deletion Anomaly\n\n✅ SOLUTION (Normalize):\nStudent(SID, Name) | Course(CID, CName) | Enrollment(SID, CID, Grade)`,
      key: '📌 The goal of normalization: ONE fact stored in ONE place. Every anomaly disappears.',
    },
    memory: {
      tricks: [
        { label: '1NF — "Atomic"', trick: '"One cell = one value." No {Maths, Science} in one cell. No repeating groups. Think: every spreadsheet cell has exactly ONE thing.' },
        { label: '2NF — "Full Key"', trick: '"Non-key attributes depend on the FULL primary key, not part of it." Only applies when key is composite. StudentName depends only on StudentID (not Course) → violation!' },
        { label: '3NF — "No Middleman"', trick: '"Non-key → Non-key = violation." If Zip determines City, and StudentID determines Zip → StudentID determines City via Zip = transitive = 3NF violation.' },
        { label: 'BCNF — "Every Arrow Left Side = Super Key"', trick: 'In every FD X→Y, X must be a super key. Stricter than 3NF — removes anomalies 3NF might miss.' },
        { label: '🧠 Mnemonic', trick: '"1 Atomic, 2 Full, 3 Direct, B Super" — Repeat 5 times. Write it on your hand before exam.' },
      ],
    },
    study: {
      steps: [
        'Don\'t start with 1NF — start with anomalies. WHY do we normalize? Understand the pain first.',
        'Practice finding Functional Dependencies (FDs). This is the hardest skill. Draw dependency arrows.',
        'Normalize the same table through 1NF → 2NF → 3NF step by step. Don\'t jump.',
        'Golden rule: If you can\'t find which NF a table is in → find the FDs first, always.',
        'For GATE: practice decomposition problems. Lossless join + dependency preservation must hold.',
      ],
      timeEstimate: '5-6 days to master (most important DBMS topic)',
      examWeight: '🔥 Very High — 3-4 marks in GATE, 2-3 in SSC/other exams. Never skip.',
    },
    apply: {
      scenario: 'Table: Order(OrderID, ProductID, ProductName, CustomerID, CustomerCity, Qty)\nFDs: OrderID+ProductID → Qty\nProductID → ProductName\nCustomerID → CustomerCity\nOrderID → CustomerID',
      question: 'Find all NF violations and normalize to 3NF.',
      answer: '2NF violation: ProductName depends on ProductID only (partial dependency)\n2NF violation: CustomerCity depends on CustomerID only\n3NF violation: CustomerCity depends on CustomerID which depends on OrderID (transitive)\n\nFinal Tables:\nProduct(ProductID, ProductName)\nCustomer(CustomerID, CustomerCity)\nOrder(OrderID, CustomerID)\nOrderItem(OrderID, ProductID, Qty)',
      examTip: '🎯 Strategy: (1) Find all FDs. (2) Find the key. (3) Check partial deps for 2NF. (4) Check transitive deps for 3NF. Draw the dependency diagram — it makes violations visible.',
    },
  },

  'SQL Joins & Subqueries': {
    color: '#60a5fa', icon: '🔗', atmosphere: '#040d1f',
    realWorld: {
      headline: 'Every app query uses joins — millions of times per second',
      uses: [
        { app: '🎬 Netflix', desc: 'User table JOIN Watch_History JOIN Movies → "You watched 3 crime dramas, here are 10 more." Joins run millions of times/second.' },
        { app: '📦 Amazon', desc: 'Order JOIN Product JOIN Customer JOIN Address → your order summary page is one complex JOIN query.' },
        { app: '🏦 Salary Slip', desc: 'Employee JOIN Department JOIN Salary_Grade → your payslip is generated by a JOIN query every month.' },
        { app: '📊 Google Analytics', desc: 'Sessions JOIN Users JOIN Pages JOIN Goals → every dashboard widget is a different JOIN aggregation.' },
      ],
    },
    story: {
      headline: 'The Attendance + Marks Problem',
      narrative: `Your school has two notebooks:\n📗 Attendance Book: RollNo | StudentName\n📘 Marks Book: RollNo | Subject | Marks\n\nPrincipal asks: "Show me names with their marks."\n\nYou manually match by RollNo — that's a JOIN.\n\nINNER JOIN = Only students who appear in BOTH books.\nLEFT JOIN = All attendance book students, even those who missed the exam (marks = NULL).\nFULL JOIN = Everyone from both books.\n\nSQL is just telling the computer which matching to do.`,
      key: '📌 A JOIN is nothing but matching two tables on a common column — exactly what you do manually when comparing two lists.',
    },
    memory: {
      tricks: [
        { label: 'INNER JOIN', trick: '"Intersection" — Only rows where both tables have a match. Think: Venn diagram center only.' },
        { label: 'LEFT JOIN', trick: '"Left table is BOSS" — Keep ALL rows from left. Right side gets NULL if no match. Left = never loses rows.' },
        { label: 'RIGHT JOIN', trick: 'Mirror of LEFT JOIN. Rarely used — just swap table order and use LEFT JOIN instead. Same result.' },
        { label: 'FULL OUTER JOIN', trick: '"Union" — Everyone from both tables, NULL fills the gaps. Think: Venn diagram with everything shaded.' },
        { label: 'Subquery Trick', trick: 'If subquery uses a column from outer query → Correlated (slow, runs per row). If completely independent → Non-correlated (fast, runs once). Always prefer NON-correlated or JOIN over correlated.' },
      ],
    },
    study: {
      steps: [
        'Draw 2 small tables (5 rows each) and manually do INNER, LEFT, RIGHT joins on paper first.',
        'Write and run every join type in MySQL/SQLite. Theory without running code = forgetting in 2 days.',
        'Practice: "Write a query to find students who have NOT submitted an assignment" → Classic LEFT JOIN + NULL check.',
        'Correlated subquery: master EXISTS and NOT EXISTS — these appear in 80% of subquery exam questions.',
        'Speed trick: If you can write it as a JOIN, always prefer JOIN over subquery for performance.',
      ],
      timeEstimate: '4-5 days (run real queries every day)',
      examWeight: '🔥 Very High — Most common practical SQL question in interviews + exams',
    },
    apply: {
      scenario: 'Tables:\nEmployee(EmpID, Name, DeptID, Salary)\nDepartment(DeptID, DeptName, ManagerID)',
      question: 'Write queries: (1) Employees with their department names (2) Employees with no department (3) Department with highest average salary',
      answer: '(1) SELECT e.Name, d.DeptName FROM Employee e INNER JOIN Department d ON e.DeptID = d.DeptID\n\n(2) SELECT e.Name FROM Employee e LEFT JOIN Department d ON e.DeptID = d.DeptID WHERE d.DeptID IS NULL\n\n(3) SELECT d.DeptName, AVG(e.Salary) as AvgSal FROM Employee e JOIN Department d ON e.DeptID=d.DeptID GROUP BY d.DeptName ORDER BY AvgSal DESC LIMIT 1',
      examTip: '🎯 "Find employees who have NO X" = LEFT JOIN + WHERE X IS NULL. This pattern appears in every SQL exam. Memorize it.',
    },
  },

  'Transaction Management': {
    color: '#34d399', icon: '🔒', atmosphere: '#021a0d',
    realWorld: {
      headline: 'Transactions are why your UPI payment never disappears',
      uses: [
        { app: '💸 UPI / PhonePe', desc: '₹500 deducted from your account + ₹500 added to receiver = ONE transaction. If network fails mid-way → rollback. Both happen or neither. ACID at work.' },
        { app: '✈️ Flight Booking', desc: 'Seat reserved + payment deducted + ticket generated = transaction. If payment fails → seat is released back. No orphan reservations.' },
        { app: '🏦 Bank Transfer', desc: '"Transfer ₹10,000" internally runs: Debit A, Credit B, Log entry — all in one atomic transaction. A crash between steps → rollback to start.' },
        { app: '🛒 Flash Sales', desc: '1000 users clicking "Buy" at the same time. 2PL ensures only one gets the last item. Isolation prevents overselling.' },
      ],
    },
    story: {
      headline: 'The ATM Power Cut Scenario',
      narrative: `You insert card. ATM deducts ₹2000 from your account.\nPower cuts before cash is dispensed.\n\nWithout transactions: ₹2000 gone, no cash. You cry.\n\nWith ACID transactions:\n• ATOMICITY: "Deduct money" AND "dispense cash" = ONE unit. Both succeed or both fail.\n• If power cuts after debit but before dispense → ROLLBACK. Money returns.\n\nThis is why in 30 years of ATMs, your money has never truly disappeared.\n\nACID is the promise that makes people trust digital money.`,
      key: '📌 A transaction is a promise: "I will complete ALL steps, or I will undo ALL steps. No in-between state."',
    },
    memory: {
      tricks: [
        { label: 'ACID Trick', trick: '"A bank transaction must be ACID." Atomicity=all or nothing, Consistency=rules preserved, Isolation=concurrent=serial, Durability=committed=permanent. Say it like a mantra.' },
        { label: '2PL — Two Phases', trick: '"Grow then Shrink." Phase 1: Only ACQUIRE locks. Phase 2: Only RELEASE locks. Once you release one lock, you can NEVER acquire another. Like checking in luggage at airport — once checked, no adding more bags.' },
        { label: 'Deadlock Detection', trick: '"Wait-For Graph." Draw arrows: A waits for B → B waits for A → cycle = DEADLOCK. No cycle = no deadlock. Simple graph problem.' },
        { label: 'Serializability', trick: '"Would a DBA be ok if this ran serially?" Conflict serializability: build precedence graph. No cycle = conflict serializable = safe.' },
        { label: 'Undo vs Redo', trick: '"Undo = Uncommitted transactions. Redo = Committed but not on disk." After crash: Undo the losers, Redo the winners.' },
      ],
    },
    study: {
      steps: [
        'Start with a real scenario: UPI payment. Map each step to ACID properties.',
        'Draw concurrent transaction schedules (tables with T1/T2 columns) — manually check for conflicts.',
        'Practice precedence graphs for serializability — this is 90% of exam questions.',
        'Master 2PL with examples: lock table, growing phase, shrinking phase, deadlock scenario.',
        'Recovery: practice one complete example — crash point, checkpoint, undo/redo lists.',
      ],
      timeEstimate: '5-6 days (hardest DBMS topic)',
      examWeight: '🔥 Very High — 3-5 marks in GATE. Most students lose marks here.',
    },
    apply: {
      scenario: 'Schedule S: T1: R(A), T2: R(A), T1: W(A), T2: W(A), T1: Commit, T2: Commit\nT1 reads A, T2 reads A, T1 writes A, T2 writes A',
      question: 'Is this schedule conflict serializable? Draw the precedence graph.',
      answer: 'Conflicts:\n• T1:W(A) conflicts with T2:R(A)? No — T2 read BEFORE T1 write → T2 before T1\n• T1:W(A) conflicts with T2:W(A)? Yes — T1 writes before T2 → T1 before T2\n\nPrecedence Graph: T2→T1 (from first conflict) AND T1→T2 (from second) → CYCLE!\n\nResult: NOT conflict serializable. This schedule can cause inconsistency.',
      examTip: '🎯 Precedence graph cycle = not serializable. Build the graph systematically: for each pair of conflicting operations (W-R, R-W, W-W), draw an edge from the transaction that goes first.',
    },
  },

  'TCP/IP Protocol Stack': {
    color: '#fbbf24', icon: '🌐', atmosphere: '#150e00',
    realWorld: {
      headline: 'TCP/IP is the reason this app is talking to you right now',
      uses: [
        { app: '📺 YouTube Video', desc: 'HTTP (Application) → TCP (Transport, guarantees no buffering) → IP (Network, routes through 15 routers) → Ethernet/WiFi (Data Link) → your screen.' },
        { app: '🎮 PUBG / Gaming', desc: 'Uses UDP instead of TCP — no delivery guarantee but ultra-fast. One missed packet = tiny glitch, not game freeze. Speed > reliability.' },
        { app: '📧 Your Email', desc: 'SMTP (send) and IMAP (receive) are Application Layer protocols. They use TCP underneath — every email byte is guaranteed to arrive.' },
        { app: '🌐 DNS (Website Loading)', desc: 'Type "google.com" → DNS query (Application Layer, UDP) → gets IP 142.250.x.x → browser connects via TCP → page loads. All in 50ms.' },
      ],
    },
    story: {
      headline: 'The Post Office Analogy',
      narrative: `Imagine sending a very long letter to a friend.\n\n📝 YOU write the letter (Application Layer — HTTP/SMTP/FTP)\n✂️ POST OFFICE cuts it into 10 pieces, numbers them (Transport Layer — TCP adds sequence numbers)\n🗺️ Each piece gets an ENVELOPE with TO/FROM address (Network Layer — IP adds source/dest IP)\n🚚 LOCAL POSTMAN delivers to right house in locality (Data Link — MAC address, last-mile delivery)\n\nTCP = Registered Post (guaranteed delivery, acknowledgment)\nUDP = Speed Post (fast, no guarantee)\n\nWhen you watch YouTube, your laptop is a POST OFFICE reassembling 10,000 packets per second.`,
      key: '📌 Each layer adds its own envelope around the data. Receiving end removes envelopes layer by layer. This is called encapsulation/decapsulation.',
    },
    memory: {
      tricks: [
        { label: 'Layer Order Mnemonic', trick: '"All People Seem To Need Data Processing" → Application, Presentation, Session, Transport, Network, Data Link, Physical (OSI). For TCP/IP: "A Tasty Network Delivers" → Application, Transport, Network, Data Link.' },
        { label: 'TCP vs UDP', trick: '"TCP = Phone Call (connection, acknowledgment, ordered). UDP = Postcard (fire and forget, fast, no guarantee)." Voice calls use UDP — one lost packet = tiny crackle, not silence.' },
        { label: '3-Way Handshake', trick: '"SYN, SYN-ACK, ACK" = "Hello?", "Hello! I heard you", "Great, I heard you too." Client → Server → Client. Like two people confirming they can hear each other.' },
        { label: 'IP vs MAC', trick: '"IP = home address (logical, changes). MAC = Aadhaar number (physical, permanent)." IP gets you to the city (router). MAC gets you to the exact door (switch).' },
        { label: 'Port Numbers', trick: 'HTTP=80, HTTPS=443, FTP=21, SSH=22, DNS=53, SMTP=25. "HTTP eighty, HTTPS four-forty-three" — song it.' },
      ],
    },
    study: {
      steps: [
        'Trace ONE packet from browser to server: Application→Transport→Network→DataLink→Physical. Draw it.',
        'Understand TCP handshake completely — draw it on paper: 3-way connect, 4-way disconnect.',
        'Practice: Given a scenario, identify which layer handles it. "Routing between cities" = Network. "Error in frame" = Data Link.',
        'IP subnetting: practice 5 subnet calculations daily (most asked in networking exams).',
        'Compare TCP vs UDP for 10 real applications — knowing WHY each uses which protocol = deep understanding.',
      ],
      timeEstimate: '6-7 days (broad topic, learn by tracing real traffic)',
      examWeight: '🔥 High — 3-4 marks. Subnetting + TCP/IP layers most common.',
    },
    apply: {
      scenario: 'You open "https://college.edu" from your hostel WiFi:\n1. Browser has URL\n2. No IP address cached\n3. Your router IP: 192.168.1.1\n4. Your PC IP: 192.168.1.105',
      question: 'Trace exactly what happens at each TCP/IP layer from keyboard press to page loading.',
      answer: '1. DNS Query (Application, UDP port 53): "What is IP of college.edu?" → gets 203.x.x.x\n2. TCP Handshake (Transport): SYN to 203.x.x.x:443 → SYN-ACK → ACK. Connection established.\n3. HTTPS Request (Application, TCP port 443): GET / HTTP/1.1\n4. IP Routing (Network): packet routed through ISP routers to 203.x.x.x\n5. Ethernet Frame (Data Link): your PC → router (by MAC address)\n6. Server responds: same layers in reverse (decapsulation)',
      examTip: '🎯 "Which layer does X?" questions: Address = Network/DataLink, Reliability = Transport, Format = Application. When confused: think about WHAT the problem is, then match to layer responsibility.',
    },
  },

  'Process Scheduling': {
    color: '#f87171', icon: '⚙️', atmosphere: '#150505',
    realWorld: {
      headline: 'Process Scheduling is why your phone runs 50 apps without freezing',
      uses: [
        { app: '📱 Your Smartphone', desc: 'WhatsApp, Spotify, Maps all "running" simultaneously. OS scheduler gives each a few milliseconds. So fast it feels parallel. Round Robin in action.' },
        { app: '☁️ AWS / Cloud Servers', desc: 'Thousands of users\' requests hitting one server. Priority scheduling ensures premium users get faster response. Your free tier? Waits longer.' },
        { app: '🖨️ Office Printer Queue', desc: 'Multiple print jobs. SJF: short documents printed first (reduces average wait). Your 500-page report waits while 10 one-pagers finish.' },
        { app: '🎬 Video Editing Software', desc: 'Render job gets HIGH priority (real-time process). Background backup gets LOW priority. Priority scheduling decides CPU share.' },
      ],
    },
    story: {
      headline: 'The Chai Tapri Queue Problem',
      narrative: `Imagine a chai tapri (tea stall) with one stove and 5 customers:\n\nCustomer A wants 1 chai (2 min)\nCustomer B wants chai + snacks (10 min)\nCustomer C wants 1 chai (2 min)\nCustomer D wants special order (15 min)\nCustomer E wants 1 chai (2 min)\n\nFCFS: A, B, C, D, E → C and E wait 12+ minutes for 2-min service. Average wait = terrible.\n\nSJF: A, C, E, B, D → Short orders first → Average wait = minimum. C and E are happy.\n\nRound Robin: Each gets 2 min turns → All get served progressively, no one waits too long.\n\nYour OS does this 1000 times per second, automatically.`,
      key: '📌 The OS scheduler is like a smart tapri owner who decides whose order to take next. Different strategies = different fairness vs speed tradeoffs.',
    },
    memory: {
      tricks: [
        { label: 'FCFS', trick: '"Simple queue at a government office." First come, first served. Suffers CONVOY EFFECT — one slow process blocks all fast ones. Like one person doing 100 photocopies while 10 people wait for 1 copy.' },
        { label: 'SJF Trick', trick: '"SJF = Shortest Job First = Minimum Average Waiting Time (OPTIMAL)." This is a theorem — SJF gives the best average WT among all non-preemptive algorithms. Remember this for exam.' },
        { label: 'Round Robin Tip', trick: '"Higher quantum → becomes FCFS. Lower quantum → too many context switches." Sweet spot: quantum = 80% of processes complete within one quantum.' },
        { label: 'Formulas', trick: 'Turnaround Time (TAT) = Completion - Arrival\nWaiting Time (WT) = TAT - Burst Time\nResponse Time = First CPU Start - Arrival\nDraw a Gantt chart first — then all formulas become mechanical.' },
        { label: 'Starvation Fix', trick: '"Aging" = gradually increase priority of waiting processes. Like a token system — the longer you wait, the more important your request becomes.' },
      ],
    },
    study: {
      steps: [
        'Master Gantt chart drawing first. Every scheduling question needs one. Practice 5 per day.',
        'Calculate WT, TAT, Response Time for FCFS, SJF, RR, Priority — use the same 5-process example for all.',
        'Understand PREEMPTIVE vs NON-PREEMPTIVE. SJF-Preemptive = SRTF (Shortest Remaining Time First).',
        'Convoy Effect (FCFS), Starvation (Priority), Time Quantum choice (RR) — understand the PROBLEM each algorithm has.',
        'Exam shortcut: Always find average WT and TAT — these are almost always asked. Draw Gantt first, numbers follow.',
      ],
      timeEstimate: '3-4 days (mostly calculation practice)',
      examWeight: 'High — 2-3 marks, always has a calculation problem',
    },
    apply: {
      scenario: 'Processes: P1(Arrival=0, Burst=8), P2(Arrival=1, Burst=4), P3(Arrival=2, Burst=9), P4(Arrival=3, Burst=5)\nAlgorithm: SJF Non-Preemptive',
      question: 'Draw Gantt chart and calculate average WT and TAT.',
      answer: 'At t=0: Only P1 ready → P1 runs (0-8)\nAt t=8: P2(4), P3(9), P4(5) ready → SJF picks P2 (shortest=4) → P2 runs (8-12)\nAt t=12: P3(9), P4(5) → SJF picks P4 → P4 runs (12-17)\nAt t=17: P3 runs (17-26)\n\nGantt: |P1:0-8|P2:8-12|P4:12-17|P3:17-26|\n\nTAT: P1=8,P2=11,P3=24,P4=14 → Avg=14.25\nWT: P1=0,P2=7,P3=15,P4=9 → Avg=7.75',
      examTip: '🎯 SJF is non-preemptive by default — once a process starts, it runs to completion even if a shorter one arrives. SRTF = preemptive SJF (preempts if new process has shorter remaining time).',
    },
  },
};

// ─── Station definitions ───────────────────────────────────────────────────────
const STATIONS = [
  { id: 'realWorld', label: 'Real World', icon: '🌍', color: '#34d399', desc: 'Where is this used IRL?' },
  { id: 'story',    label: 'The Story',   icon: '🎭', color: '#fbbf24', desc: 'An analogy you\'ll never forget' },
  { id: 'memory',   label: 'Memory Lock', icon: '🧠', color: '#a78bfa', desc: 'Tricks to never forget this' },
  { id: 'study',    label: 'Study Plan',  icon: '📚', color: '#60a5fa', desc: 'How to master this topic' },
  { id: 'apply',    label: 'Apply It',    icon: '⚡', color: '#f87171', desc: 'Real exam scenario + answer' },
];

function getTopicData(name) {
  return TOPIC_DB[name] || {
    color: '#a78bfa', icon: '🌌', atmosphere: '#050510',
    realWorld: {
      headline: 'This topic has wide real-world applications',
      uses: [
        { app: '💻 Software Systems', desc: 'Fundamental concepts from this topic power most modern software.' },
        { app: '🏢 Enterprise Apps', desc: 'Industry applications rely on these principles daily.' },
        { app: '📱 Mobile Apps', desc: 'Mobile development leverages this topic extensively.' },
        { app: '☁️ Cloud Services', desc: 'Cloud infrastructure is built on these foundations.' },
      ],
    },
    story: {
      headline: 'Understanding Through Analogy',
      narrative: 'Every complex technical topic has a real-world analogy that makes it instantly clear.\n\nThis topic, when broken down, follows patterns you already understand from daily life.\n\nThe key is to map abstract concepts to concrete experiences you already have.',
      key: '📌 Technical concepts are just precise descriptions of things that happen in the real world.',
    },
    memory: {
      tricks: [
        { label: 'Core Idea', trick: 'Break the topic into 3-5 key ideas. Each key idea should fit in one sentence.' },
        { label: 'Analogy', trick: 'Find one real-world thing that works similarly. Your brain remembers analogies better than definitions.' },
        { label: 'Acronym', trick: 'Create an acronym from the first letters of key terms. Say it out loud 5 times.' },
        { label: 'Teach It', trick: 'Explain the concept to an imaginary student. Gaps in explanation = gaps in your understanding.' },
        { label: 'Draw It', trick: 'Sketch a diagram from memory. Visual + motor memory together = stronger retention.' },
      ],
    },
    study: {
      steps: [
        'Read the overview first — understand the BIG PICTURE before diving into details.',
        'Find 3 real examples of this topic in action — ground theory in practice.',
        'Solve 5 problems without looking at notes — identifies exactly where gaps are.',
        'Review mistakes only — don\'t re-study what you already know.',
        'Teach someone else or explain to yourself out loud — best test of mastery.',
      ],
      timeEstimate: '4-5 days for solid understanding',
      examWeight: 'Check your syllabus for exact weightage',
    },
    apply: {
      scenario: 'Apply the core concepts of this topic to a practical problem.',
      question: 'How would you use this topic\'s principles to solve a real-world challenge?',
      answer: 'Start by identifying which concept applies. Map the problem to the theory. Apply step by step. Verify the result makes sense in context.',
      examTip: '🎯 In exams: identify the concept being tested, write the relevant formula/rule, apply systematically, show all steps.',
    },
  };
}

// ─── 3D: Station Portal ───────────────────────────────────────────────────────
function StationPortal({ station, index, total, isSelected, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const angle = (index / total) * Math.PI * 2;
  const r = 3.8;
  const baseX = Math.cos(angle) * r;
  const baseZ = Math.sin(angle) * r;
  const baseY = Math.sin(angle * 1.5) * 0.5;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.012;
      meshRef.current.rotation.x += 0.006;
      meshRef.current.position.y = baseY + Math.sin(t * 0.65 + index * 1.2) * 0.3;
    }
    if (glowRef.current) glowRef.current.rotation.z += 0.02;
  });

  const shapes = [
    <octahedronGeometry args={[0.38, 0]} />,
    <tetrahedronGeometry args={[0.42, 0]} />,
    <icosahedronGeometry args={[0.34, 0]} />,
    <boxGeometry args={[0.55, 0.55, 0.55]} />,
    <dodecahedronGeometry args={[0.36, 0]} />,
  ];

  return (
    <group position={[baseX, baseY, baseZ]}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(station.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        {shapes[index % shapes.length]}
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : station.color}
          emissive={station.color}
          emissiveIntensity={isSelected ? 1.8 : 0.5}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>

      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.02, 8, 40]} />
        <meshStandardMaterial
          color={station.color}
          emissive={station.color}
          emissiveIntensity={isSelected ? 3 : 0.8}
          transparent opacity={isSelected ? 1 : 0.5}
        />
      </mesh>

      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? `${station.color}33` : `${station.color}15`,
          border: `1px solid ${station.color}${isSelected ? 'aa' : '44'}`,
          borderRadius: 20,
          padding: '4px 10px',
          marginTop: 58,
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          boxShadow: isSelected ? `0 0 16px ${station.color}66` : 'none',
        }}>
          <span style={{ fontSize: 13 }}>{station.icon}</span>
          <span style={{
            color: '#fff', fontSize: 9.5, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase',
            marginLeft: 5, fontFamily: 'system-ui',
          }}>{station.label}</span>
        </div>
      </Html>
    </group>
  );
}

// ─── 3D: Central Hub ──────────────────────────────────────────────────────────
function CentralHub({ topicName, color, icon }) {
  const coreRef = useRef();
  const r1 = useRef();
  const r2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.006;
      coreRef.current.rotation.x = Math.sin(t * 0.4) * 0.1;
    }
    if (r1.current) r1.current.rotation.z += 0.008;
    if (r2.current) r2.current.rotation.x += 0.006;
  });

  const short = topicName.length > 20 ? topicName.slice(0, 18) + '…' : topicName;

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} metalness={0.8} roughness={0.08} />
      </mesh>
      <mesh ref={r1} rotation={[Math.PI / 3.2, 0, 0]}>
        <torusGeometry args={[1.6, 0.022, 8, 80]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.65} />
      </mesh>
      <mesh ref={r2} rotation={[-Math.PI / 5, Math.PI / 4, 0]}>
        <torusGeometry args={[2.1, 0.014, 8, 80]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.4} />
      </mesh>
      <Html center distanceFactor={5}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', marginTop: 140, userSelect: 'none' }}>
          <div style={{ fontSize: 24, marginBottom: 4, filter: `drop-shadow(0 0 10px ${color})` }}>{icon}</div>
          <div style={{
            color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: 3,
            textTransform: 'uppercase', fontFamily: 'system-ui',
            textShadow: `0 0 24px ${color}, 0 0 8px #000`,
            maxWidth: 180, lineHeight: 1.4, textAlign: 'center',
          }}>{short}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 2, marginTop: 6, fontFamily: 'system-ui' }}>
            CLICK A STATION
          </div>
        </div>
      </Html>
    </group>
  );
}

function Scene({ topicData, topicName, selectedStation, onSelectStation }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={3} color={topicData.color} distance={14} decay={2} />
      <pointLight position={[0, 14, -10]} intensity={0.6} color="#aaddff" />
      <pointLight position={[-10, -4, 8]} intensity={0.4} color={topicData.color} distance={22} />
      <Stars radius={90} depth={60} count={5500} factor={4} saturation={0} fade speed={1.2} />
      <CentralHub topicName={topicName} color={topicData.color} icon={topicData.icon} />
      {STATIONS.map((s, i) => (
        <StationPortal
          key={s.id}
          station={s}
          index={i}
          total={STATIONS.length}
          isSelected={selectedStation === s.id}
          onClick={onSelectStation}
        />
      ))}
      <OrbitControls enablePan={false} minDistance={5} maxDistance={14} autoRotate autoRotateSpeed={0.4} enableDamping dampingFactor={0.07} />
    </>
  );
}

// ─── Station Content Panels ───────────────────────────────────────────────────
function RealWorldPanel({ data, color }) {
  return (
    <div>
      <p style={{ color: color, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>REAL WORLD USES</p>
      <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 16, lineHeight: 1.4 }}>{data.headline}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.uses.map((u, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{u.app}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11.5, lineHeight: 1.6 }}>{u.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryPanel({ data, color }) {
  return (
    <div>
      <p style={{ color: color, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>THE STORY</p>
      <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 14, lineHeight: 1.4 }}>{data.headline}</h3>
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 12,
        padding: '14px 14px', marginBottom: 14, borderLeft: `3px solid ${color}`,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
          {data.narrative}
        </p>
      </div>
      <div style={{
        background: `${color}18`, border: `1px solid ${color}44`,
        borderRadius: 10, padding: '10px 14px',
      }}>
        <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.6 }}>{data.key}</p>
      </div>
    </div>
  );
}

function MemoryPanel({ data, color }) {
  return (
    <div>
      <p style={{ color: color, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>MEMORY TRICKS</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.tricks.map((t, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 10,
            padding: '10px 12px', borderLeft: `2px solid ${color}88`,
          }}>
            <div style={{ color: color, fontSize: 10.5, fontWeight: 800, letterSpacing: 1, marginBottom: 5, textTransform: 'uppercase' }}>
              {t.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.7 }}>{t.trick}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudyPanel({ data, color }) {
  return (
    <div>
      <p style={{ color: color, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>STUDY PLAN</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 9, padding: '10px 12px' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>TIME</div>
          <div style={{ color: '#fff', fontSize: 11.5, fontWeight: 700 }}>{data.timeEstimate}</div>
        </div>
        <div style={{ flex: 1, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 9, padding: '10px 12px' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>EXAM WEIGHT</div>
          <div style={{ color: '#fff', fontSize: 11.5, fontWeight: 700 }}>{data.examWeight}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              minWidth: 22, height: 22, borderRadius: '50%',
              background: `${color}33`, border: `1px solid ${color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: color, fontSize: 10, fontWeight: 800, flexShrink: 0,
            }}>{i + 1}</div>
            <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, lineHeight: 1.65, marginTop: 2 }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyPanel({ data, color }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <p style={{ color: color, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>APPLY IT</p>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px', marginBottom: 12, borderLeft: `3px solid ${color}` }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>SCENARIO</div>
        <pre style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
          {data.scenario}
        </pre>
      </div>
      <div style={{ background: `${color}15`, borderRadius: 10, padding: '12px', marginBottom: 12, border: `1px solid ${color}33` }}>
        <div style={{ color: color, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>QUESTION</div>
        <p style={{ color: '#fff', fontSize: 12, lineHeight: 1.65 }}>{data.question}</p>
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          style={{
            width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer',
            background: `${color}22`, border: `1px solid ${color}55`, color: color,
            fontSize: 11, fontWeight: 800, letterSpacing: 2, fontFamily: 'system-ui',
          }}
        >
          REVEAL ANSWER ↓
        </button>
      ) : (
        <>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '12px', marginBottom: 10 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>ANSWER</div>
            <pre style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11.5, lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
              {data.answer}
            </pre>
          </div>
          <div style={{ background: '#fbbf2418', border: '1px solid #fbbf2444', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600, lineHeight: 1.65 }}>{data.examTip}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Portal Opening ───────────────────────────────────────────────────────────
function PortalOpening({ topicName, color }) {
  return (
    <motion.div
      key="portal"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeIn' }}
      style={{
        position: 'absolute', inset: 0, background: '#000', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {[60, 130, 220, 340, 500, 700].map((size, i) => (
        <motion.div key={i} style={{
          position: 'absolute', width: size, height: size, borderRadius: '50%',
          border: `1px solid ${color}`, boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}18`,
        }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.15, 1], opacity: [0, 0.9, 0.15 - i * 0.02] }}
          transition={{ delay: i * 0.11, duration: 1.8, ease: 'easeOut' }}
        />
      ))}

      <motion.div style={{
        position: 'absolute', width: 32, height: 32, borderRadius: '50%',
        background: color, boxShadow: `0 0 80px 20px ${color}80, 0 0 160px 40px ${color}30`,
      }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 1.2], opacity: [0, 1, 0.85] }}
        transition={{ duration: 1.4 }}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', userSelect: 'none' }}>
        <motion.p style={{ fontSize: 10, letterSpacing: 7, fontWeight: 700, color: `${color}bb`, marginBottom: 14, fontFamily: 'system-ui' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          ENTERING
        </motion.p>
        <motion.h1 style={{
          fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 14, lineHeight: 1.2,
          fontFamily: 'system-ui', textShadow: `0 0 40px ${color}, 0 0 80px ${color}50`,
          maxWidth: 340, textAlign: 'center',
        }}
          initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, type: 'spring', stiffness: 140, damping: 18 }}>
          {topicName}
        </motion.h1>
        <motion.p style={{ fontSize: 10, letterSpacing: 9, fontWeight: 700, color: `${color}88`, marginBottom: 36, fontFamily: 'system-ui' }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25 }}>
          LEARNING UNIVERSE
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 180, height: 2, background: `${color}25`, borderRadius: 2, overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: color, borderRadius: 2 }}
              initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ delay: 0.55, duration: 2.1, ease: 'easeInOut' }} />
          </div>
          <p style={{ fontSize: 9, letterSpacing: 4, color: `${color}55`, fontFamily: 'system-ui', fontWeight: 600 }}>
            5 LEARNING STATIONS LOADING...
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TopicVirtualWorld({ topic, onClose }) {
  const [phase, setPhase] = useState('portal');
  const [selectedStation, setSelectedStation] = useState(null);
  const topicData = getTopicData(topic);

  useEffect(() => {
    const t = setTimeout(() => setPhase('world'), 2900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { if (selectedStation) setSelectedStation(null); else onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, selectedStation]);

  const activeStation = STATIONS.find((s) => s.id === selectedStation);
  const stationData = activeStation ? topicData[selectedStation] : null;

  function renderPanel() {
    if (!activeStation || !stationData) return null;
    switch (selectedStation) {
      case 'realWorld': return <RealWorldPanel data={stationData} color={activeStation.color} />;
      case 'story':     return <StoryPanel     data={stationData} color={activeStation.color} />;
      case 'memory':    return <MemoryPanel    data={stationData} color={activeStation.color} />;
      case 'study':     return <StudyPanel     data={stationData} color={activeStation.color} />;
      case 'apply':     return <ApplyPanel     data={stationData} color={activeStation.color} />;
      default:          return null;
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
      <AnimatePresence>
        {phase === 'portal' && <PortalOpening topicName={topic} color={topicData.color} />}
      </AnimatePresence>

      {phase === 'world' && (
        <motion.div style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }}>

          <Canvas camera={{ position: [0, 2.5, 10], fov: 58 }}
            style={{ background: topicData.atmosphere, width: '100%', height: '100%' }}>
            <Scene
              topicData={topicData} topicName={topic}
              selectedStation={selectedStation}
              onSelectStation={(id) => setSelectedStation(id === selectedStation ? null : id)}
            />
          </Canvas>

          {/* Top HUD */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}>
            <div>
              <p style={{ color: `${topicData.color}88`, fontSize: 9, letterSpacing: 5, fontWeight: 700, fontFamily: 'system-ui', marginBottom: 3 }}>
                LEARNING UNIVERSE
              </p>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'system-ui', textShadow: `0 0 20px ${topicData.color}55` }}>
                {topicData.icon} {topic}
              </h2>
            </div>
            <button onClick={onClose} style={{
              pointerEvents: 'auto',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)',
              color: 'rgba(255,255,255,0.8)', padding: '7px 16px', borderRadius: 8,
              cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: 'system-ui',
            }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              ✕ EXIT
            </button>
          </div>

          {/* Station legend - bottom bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
            display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            {STATIONS.map((s) => (
              <button key={s.id}
                onClick={() => setSelectedStation(s.id === selectedStation ? null : s.id)}
                style={{
                  background: selectedStation === s.id ? `${s.color}33` : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${selectedStation === s.id ? s.color + '88' : 'rgba(255,255,255,0.12)'}`,
                  color: selectedStation === s.id ? '#fff' : 'rgba(255,255,255,0.6)',
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, fontFamily: 'system-ui',
                  display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: selectedStation === s.id ? `0 0 12px ${s.color}44` : 'none',
                  transition: 'all 0.2s',
                }}>
                <span>{s.icon}</span>
                <span style={{ letterSpacing: 0.5 }}>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Station detail panel */}
          <AnimatePresence>
            {selectedStation && activeStation && (
              <motion.div key={selectedStation}
                initial={{ x: 340, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 340, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  width: 300, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
                  background: 'rgba(4,4,12,0.92)', border: `1px solid ${activeStation.color}40`,
                  borderRadius: 18, padding: '20px 18px',
                  backdropFilter: 'blur(28px)',
                  boxShadow: `0 0 50px ${activeStation.color}20, 0 8px 50px rgba(0,0,0,0.7)`,
                  fontFamily: 'system-ui',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${activeStation.color}44 transparent`,
                }}>
                {/* Panel header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                  paddingBottom: 14, borderBottom: `1px solid rgba(255,255,255,0.07)`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${activeStation.color}20`, border: `2px solid ${activeStation.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    boxShadow: `0 0 16px ${activeStation.color}44`,
                  }}>
                    {activeStation.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>{activeStation.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{activeStation.desc}</div>
                  </div>
                  <button onClick={() => setSelectedStation(null)} style={{
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1,
                  }}>✕</button>
                </div>

                {renderPanel()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
