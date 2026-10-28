import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls, Html } from '@react-three/drei';

// ─── Topic content database ───────────────────────────────────────────────────
const TOPIC_DB = {
  'ER Model & Diagrams': {
    color: '#a78bfa', icon: '🗺️', atmosphere: '#08051a',
    concepts: [
      { name: 'Entity Types', desc: 'Strong & Weak entities — strong have their own key, weak depend on a parent entity.' },
      { name: 'Attributes', desc: 'Simple, Composite, Derived, Multi-valued. Derived (age from DOB) stored logically.' },
      { name: 'Relationships', desc: 'Binary (2 entities), Ternary (3), Recursive (same entity twice).' },
      { name: 'Cardinality', desc: '1:1 (passport-person), 1:N (dept-emp), M:N (student-course).' },
      { name: 'ER to Relational', desc: 'Each strong entity → table. M:N → separate join table. Weak entity borrows PK.' },
      { name: 'Participation', desc: 'Total (double line) = every entity must participate. Partial (single) = optional.' },
    ],
  },
  'Normalization (1NF-BCNF)': {
    color: '#f472b6', icon: '⚗️', atmosphere: '#150510',
    concepts: [
      { name: '1NF', desc: 'No repeating groups, each cell atomic. Split multi-valued attributes into rows.' },
      { name: '2NF', desc: 'Must be 1NF + no partial dependency (non-key attr depends on part of composite key).' },
      { name: '3NF', desc: 'Must be 2NF + no transitive dependency (A→B→C where B is non-key).' },
      { name: 'BCNF', desc: 'Stricter than 3NF. For every functional dependency X→Y, X must be a super key.' },
      { name: 'Functional Deps', desc: 'X→Y means knowing X determines Y. Find closure F⁺ to check keys.' },
      { name: 'Anomalies', desc: 'Insertion, Update & Deletion anomalies arise from bad design — normalization fixes them.' },
    ],
  },
  'SQL Joins & Subqueries': {
    color: '#60a5fa', icon: '🔗', atmosphere: '#040d1f',
    concepts: [
      { name: 'INNER JOIN', desc: 'Returns only rows where the join condition matches in BOTH tables.' },
      { name: 'LEFT JOIN', desc: 'All rows from left table + matching right rows. NULL for no match on right.' },
      { name: 'FULL OUTER JOIN', desc: 'All rows from both tables. NULL filled where no match on either side.' },
      { name: 'Self Join', desc: 'Table joined with itself. Used for hierarchy (employee-manager in same table).' },
      { name: 'Subqueries', desc: 'Nested SELECT inside WHERE/HAVING/FROM. Can return scalar, row or table.' },
      { name: 'Correlated', desc: 'Subquery references a column from the outer query. Runs once per outer row.' },
    ],
  },
  'Transaction Management': {
    color: '#34d399', icon: '🔒', atmosphere: '#021a0d',
    concepts: [
      { name: 'ACID', desc: 'Atomicity (all or nothing), Consistency, Isolation (concurrent = serial), Durability.' },
      { name: 'Serializability', desc: 'A schedule is serializable if equivalent to some serial schedule. Conflict vs View.' },
      { name: 'Concurrency', desc: 'Multiple transactions run together. Lock-based or timestamp protocols manage this.' },
      { name: '2PL Protocol', desc: 'Two-Phase Locking: Growing phase (acquire locks) → Shrinking phase (release). No new locks after first release.' },
      { name: 'Deadlock', desc: 'Cycle in wait-for graph. Detection (periodic check), Prevention (timestamps), Recovery (abort).' },
      { name: 'Recovery', desc: 'Undo (rollback uncommitted), Redo (recommit committed). Checkpointing limits log scan.' },
    ],
  },
  'TCP/IP Protocol Stack': {
    color: '#fbbf24', icon: '🌐', atmosphere: '#150e00',
    concepts: [
      { name: 'Application Layer', desc: 'HTTP (web), SMTP (email), FTP (files), DNS (name→IP), DHCP (IP assign).' },
      { name: 'Transport Layer', desc: 'TCP: reliable, ordered, connection-oriented. UDP: fast, no guarantee, connectionless.' },
      { name: 'Network Layer', desc: 'IP addressing, routing (RIP/OSPF/BGP), fragmentation, ICMP (ping/traceroute).' },
      { name: 'Data Link Layer', desc: 'Framing, MAC addresses, error detection (CRC), ARP (IP→MAC mapping).' },
      { name: 'TCP Handshake', desc: 'SYN → SYN-ACK → ACK. Connection established in 3 steps. 4-step FIN for close.' },
      { name: 'Flow Control', desc: 'Sliding window limits sender speed. Congestion control: slow start + AIMD.' },
    ],
  },
  'Process Scheduling': {
    color: '#f87171', icon: '⚙️', atmosphere: '#150505',
    concepts: [
      { name: 'FCFS', desc: 'First Come First Served. Simple, non-preemptive. Suffers convoy effect (long job blocks short).' },
      { name: 'SJF', desc: 'Shortest Job First. Optimal average waiting time. Preemptive version = SRTF.' },
      { name: 'Round Robin', desc: 'Fixed time quantum. Preemptive. Fair. Higher quantum → FCFS. Lower → high context switch overhead.' },
      { name: 'Priority', desc: 'Lower number = higher priority (usually). Add aging to prevent starvation of low-priority jobs.' },
      { name: 'Gantt Chart', desc: 'Horizontal bar chart showing which process runs at what time. Use to calculate WT and TAT.' },
      { name: 'Key Metrics', desc: 'Waiting Time = TAT − Burst. Turnaround Time = Completion − Arrival. Response Time = First CPU − Arrival.' },
    ],
  },
};

function getTopicData(name) {
  return TOPIC_DB[name] || {
    color: '#a78bfa', icon: '🌌', atmosphere: '#050510',
    concepts: [
      { name: 'Core Concept', desc: 'The fundamental idea behind this topic.' },
      { name: 'Key Principles', desc: 'Main rules and principles that govern this topic.' },
      { name: 'Applications', desc: 'Where and how this topic is used in real world.' },
      { name: 'Examples', desc: 'Common examples and worked cases for practice.' },
      { name: 'Theory', desc: 'The theoretical background and formal definitions.' },
      { name: 'Practice', desc: 'Practice problems, MCQs and exam strategies.' },
    ],
  };
}

// ─── 3D: Concept Orb ─────────────────────────────────────────────────────────
function ConceptOrb({ concept, index, total, color, isSelected, onSelect }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const angle = (index / total) * Math.PI * 2;
  const radius = 3.6;
  const baseX = Math.cos(angle) * radius;
  const baseZ = Math.sin(angle) * radius;
  const baseY = Math.sin(angle * 1.7) * 0.6;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.position.y = baseY + Math.sin(t * 0.7 + index * 1.1) * 0.28;
      meshRef.current.rotation.y += 0.008;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.015;
    }
  });

  return (
    <group position={[baseX, baseY, baseZ]}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : concept); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.4 : 0.45}
          metalness={0.4}
          roughness={0.15}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Equatorial glow ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.025, 8, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 2.5 : 0.7}
          transparent
          opacity={isSelected ? 1 : 0.45}
        />
      </mesh>

      {/* Label */}
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: `${color}1a`,
          border: `1px solid ${color}55`,
          color: '#fff',
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 9.5,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          marginTop: 52,
          letterSpacing: 1,
          textTransform: 'uppercase',
          backdropFilter: 'blur(6px)',
          boxShadow: isSelected ? `0 0 14px ${color}88` : 'none',
        }}>
          {concept.name}
        </div>
      </Html>
    </group>
  );
}

// ─── 3D: Central Hub ──────────────────────────────────────────────────────────
function CentralHub({ topicName, color, icon }) {
  const coreRef = useRef();
  const r1Ref = useRef();
  const r2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.006;
      coreRef.current.rotation.x = Math.sin(t * 0.4) * 0.12;
    }
    if (r1Ref.current) r1Ref.current.rotation.z += 0.009;
    if (r2Ref.current) r2Ref.current.rotation.x += 0.006;
  });

  const shortName = topicName.length > 22 ? topicName.slice(0, 20) + '…' : topicName;

  return (
    <group>
      {/* Core polyhedron */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.85, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          metalness={0.8}
          roughness={0.08}
        />
      </mesh>

      {/* Inner orbit ring */}
      <mesh ref={r1Ref} rotation={[Math.PI / 3.5, 0, 0]}>
        <torusGeometry args={[1.5, 0.022, 8, 80]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.7} />
      </mesh>

      {/* Outer orbit ring */}
      <mesh ref={r2Ref} rotation={[-Math.PI / 5, Math.PI / 5, 0]}>
        <torusGeometry args={[2.0, 0.014, 8, 80]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} transparent opacity={0.45} />
      </mesh>

      {/* Topic label below sphere */}
      <Html center distanceFactor={5}>
        <div style={{ textAlign: 'center', pointerEvents: 'none', marginTop: 130, userSelect: 'none' }}>
          <div style={{ fontSize: 22, marginBottom: 4, filter: 'drop-shadow(0 0 8px ' + color + ')' }}>{icon}</div>
          <div style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: 'uppercase',
            textShadow: `0 0 24px ${color}, 0 0 8px #000`,
            maxWidth: 180,
            lineHeight: 1.4,
            textAlign: 'center',
          }}>
            {shortName}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── 3D Scene ─────────────────────────────────────────────────────────────────
function Scene({ topicData, topicName, selectedConcept, onSelectConcept }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={3} color={topicData.color} distance={12} decay={2} />
      <pointLight position={[0, 12, -8]} intensity={0.7} color="#aaddff" />
      <pointLight position={[-8, -4, 6]} intensity={0.4} color={topicData.color} distance={20} />

      <Stars radius={90} depth={60} count={5000} factor={4} saturation={0} fade speed={1.2} />

      <CentralHub topicName={topicName} color={topicData.color} icon={topicData.icon} />

      {topicData.concepts.map((concept, i) => (
        <ConceptOrb
          key={concept.name}
          concept={concept}
          index={i}
          total={topicData.concepts.length}
          color={topicData.color}
          isSelected={selectedConcept?.name === concept.name}
          onSelect={onSelectConcept}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={4.5}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.07}
      />
    </>
  );
}

// ─── Portal Opening Screen ────────────────────────────────────────────────────
function PortalOpening({ topicName, color }) {
  const rings = [60, 130, 220, 340, 500, 700];

  return (
    <motion.div
      key="portal"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeIn' }}
      style={{
        position: 'absolute', inset: 0, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', overflow: 'hidden', zIndex: 2,
      }}
    >
      {/* Expanding rings */}
      {rings.map((size, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: size, height: size,
            borderRadius: '50%',
            border: `1px solid ${color}`,
            boxShadow: `0 0 18px ${color}40, inset 0 0 18px ${color}20`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.15, 1], opacity: [0, 0.9, 0.18 - i * 0.02] }}
          transition={{ delay: i * 0.12, duration: 1.8, ease: 'easeOut' }}
        />
      ))}

      {/* Center glow point */}
      <motion.div
        style={{
          position: 'absolute',
          width: 32, height: 32, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 80px 20px ${color}80, 0 0 160px 40px ${color}30`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 1.2], opacity: [0, 1, 0.85] }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      {/* Text content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', userSelect: 'none' }}>
        <motion.p
          style={{
            fontSize: 10, letterSpacing: 7, fontWeight: 700,
            color: `${color}bb`, marginBottom: 14,
            fontFamily: 'system-ui, sans-serif',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          ENTERING
        </motion.p>

        <motion.h1
          style={{
            fontSize: 26, fontWeight: 900, letterSpacing: 2,
            color: '#ffffff', marginBottom: 14, lineHeight: 1.2,
            fontFamily: 'system-ui, sans-serif',
            textShadow: `0 0 40px ${color}, 0 0 80px ${color}50`,
            maxWidth: 320, textAlign: 'center',
          }}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, type: 'spring', stiffness: 140, damping: 18 }}
        >
          {topicName}
        </motion.h1>

        <motion.p
          style={{
            fontSize: 10, letterSpacing: 9, fontWeight: 700,
            color: `${color}88`, marginBottom: 36,
            fontFamily: 'system-ui, sans-serif',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.6 }}
        >
          UNIVERSE
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <div style={{
            width: 180, height: 2,
            background: `${color}25`,
            borderRadius: 2, overflow: 'hidden',
          }}>
            <motion.div
              style={{ height: '100%', background: color, borderRadius: 2 }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.55, duration: 2.1, ease: 'easeInOut' }}
            />
          </div>
          <p style={{
            fontSize: 9, letterSpacing: 4, color: `${color}55`,
            fontFamily: 'system-ui, sans-serif', fontWeight: 600,
          }}>
            LOADING VIRTUAL WORLD...
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TopicVirtualWorld({ topic, onClose }) {
  const [phase, setPhase] = useState('portal');
  const [selectedConcept, setSelectedConcept] = useState(null);
  const topicData = getTopicData(topic);

  // Switch to 3D world after portal animation
  useEffect(() => {
    const t = setTimeout(() => setPhase('world'), 2900);
    return () => clearTimeout(t);
  }, []);

  // ESC to exit
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
      <AnimatePresence>
        {phase === 'portal' && (
          <PortalOpening topicName={topic} color={topicData.color} />
        )}
      </AnimatePresence>

      {phase === 'world' && (
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
        >
          {/* 3D Canvas */}
          <Canvas
            camera={{ position: [0, 2.5, 9], fov: 58 }}
            style={{ background: topicData.atmosphere, width: '100%', height: '100%' }}
          >
            <Scene
              topicData={topicData}
              topicName={topic}
              selectedConcept={selectedConcept}
              onSelectConcept={setSelectedConcept}
            />
          </Canvas>

          {/* Top HUD bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '18px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}>
            <div>
              <p style={{
                color: `${topicData.color}99`, fontSize: 9, letterSpacing: 5,
                fontWeight: 700, fontFamily: 'system-ui', marginBottom: 4,
              }}>
                VIRTUAL STUDY UNIVERSE
              </p>
              <h2 style={{
                color: '#fff', fontSize: 17, fontWeight: 800,
                fontFamily: 'system-ui', textShadow: `0 0 20px ${topicData.color}60`,
              }}>
                {topicData.icon} {topic}
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.85)',
                padding: '8px 18px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                fontFamily: 'system-ui',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              ✕ EXIT UNIVERSE
            </button>
          </div>

          {/* Concept detail panel */}
          <AnimatePresence>
            {selectedConcept && (
              <motion.div
                key="panel"
                initial={{ x: 310, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 310, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                style={{
                  position: 'absolute', right: 20,
                  top: '50%', transform: 'translateY(-50%)',
                  width: 272,
                  background: 'rgba(4,4,10,0.88)',
                  border: `1px solid ${topicData.color}40`,
                  borderRadius: 16,
                  padding: 22,
                  backdropFilter: 'blur(24px)',
                  boxShadow: `0 0 40px ${topicData.color}18, 0 8px 40px rgba(0,0,0,0.6)`,
                  fontFamily: 'system-ui',
                }}
              >
                {/* Orb indicator */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `${topicData.color}18`,
                  border: `2px solid ${topicData.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  boxShadow: `0 0 24px ${topicData.color}50`,
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: topicData.color,
                    boxShadow: `0 0 10px ${topicData.color}`,
                  }} />
                </div>

                <p style={{ color: `${topicData.color}88`, fontSize: 9, letterSpacing: 4, fontWeight: 700, marginBottom: 6 }}>
                  CONCEPT
                </p>
                <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>
                  {selectedConcept.name}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 12.5, lineHeight: 1.75 }}>
                  {selectedConcept.desc}
                </p>

                <button
                  onClick={() => setSelectedConcept(null)}
                  style={{
                    marginTop: 18, display: 'block',
                    background: `${topicData.color}1a`,
                    border: `1px solid ${topicData.color}44`,
                    color: topicData.color,
                    padding: '7px 16px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  CLOSE ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom hint */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            style={{
              position: 'absolute', bottom: 22,
              left: '50%', transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.28)',
              fontSize: 9, letterSpacing: 3.5,
              fontFamily: 'system-ui', fontWeight: 600,
              pointerEvents: 'none', userSelect: 'none',
              textAlign: 'center', whiteSpace: 'nowrap',
            }}
          >
            DRAG TO EXPLORE &nbsp;·&nbsp; CLICK ORBS TO LEARN &nbsp;·&nbsp; ESC TO EXIT
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
