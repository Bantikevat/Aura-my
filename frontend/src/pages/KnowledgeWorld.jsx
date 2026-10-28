import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WORLDS } from '../store/useAuraStore';

// ── persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aura-knowledge-v2';

const SEED = [
  { id: 'dbms',         label: 'DBMS',             type: 'Subject',  desc: 'Database Management Systems — storage, retrieval, and management of structured data.',  links: ['sql', 'normalization', 'transactions'] },
  { id: 'sql',          label: 'SQL',               type: 'Concept',  desc: 'Structured Query Language for CRUD operations, joins, aggregations, subqueries.',        links: ['dbms', 'normalization'] },
  { id: 'normalization',label: 'Normalization',      type: 'Concept',  desc: '1NF → 2NF → 3NF → BCNF. Reduces data redundancy and improves integrity.',              links: ['dbms', 'sql'] },
  { id: 'transactions', label: 'Transactions',       type: 'Concept',  desc: 'ACID properties. Concurrency control using locks, 2PL, and timestamp ordering.',        links: ['dbms'] },
  { id: 'networks',     label: 'Computer Networks',  type: 'Subject',  desc: 'OSI model, TCP/IP, routing, subnetting, application layer protocols.',                   links: ['tcp', 'os'] },
  { id: 'tcp',          label: 'TCP/IP',             type: 'Concept',  desc: '4-layer model. Connection-oriented TCP vs. connectionless UDP. 3-way handshake.',        links: ['networks'] },
  { id: 'os',           label: 'Operating Systems',  type: 'Subject',  desc: 'Process scheduling, memory management, deadlocks, file systems.',                       links: ['networks', 'scheduling'] },
  { id: 'scheduling',   label: 'Process Scheduling', type: 'Concept',  desc: 'FCFS, SJF, Round Robin, Priority. Preemptive vs. non-preemptive. Gantt charts.',        links: ['os'] },
  { id: 'react',        label: 'React',              type: 'Skill',    desc: 'Component model, hooks, state management, Framer Motion, React Three Fiber.',           links: ['aura', 'js'] },
  { id: 'js',           label: 'JavaScript',         type: 'Skill',    desc: 'Event loop, closures, async/await, ES6+, DOM manipulation.',                            links: ['react'] },
  { id: 'aura',         label: 'AURA Project',       type: 'Project',  desc: 'Personal AI OS — MERN super-app with virtual worlds, AI, task management.',             links: ['react', 'dbms', 'career'] },
  { id: 'career',       label: 'Career Goals',       type: 'Goal',     desc: 'Full-Stack Developer at a product company. Target: 2025-26.',                           links: ['react', 'aura', 'js'] },
];

const TYPE_META = {
  Subject:  { color: '#60a5fa', icon: '📚' },
  Concept:  { color: '#a78bfa', icon: '💡' },
  Skill:    { color: '#34d399', icon: '⚡' },
  Project:  { color: '#fbbf24', icon: '🔨' },
  Goal:     { color: '#f472b6', icon: '🎯' },
  Resource: { color: '#22d3ee', icon: '🔗' },
};
const TYPES = Object.keys(TYPE_META);

function load() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : SEED; }
  catch { return SEED; }
}
function persist(nodes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)); } catch { /* */ }
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const inputCls = 'w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20 transition';

// ── Add/Edit Node Modal ───────────────────────────────────────────────────────
function NodeModal({ node, allNodes, onSave, onClose }) {
  const [label,    setLabel]    = useState(node?.label || '');
  const [type,     setType]     = useState(node?.type  || 'Concept');
  const [desc,     setDesc]     = useState(node?.desc  || '');
  const [links,    setLinks]    = useState(node?.links || []);
  const meta = TYPE_META[type];

  function toggleLink(id) {
    setLinks((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const linkCandidates = allNodes.filter((n) => !node || n.id !== node.id);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.09)' }}
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-white mb-5">
          {node ? '✏️ Edit Node' : '✨ Add Knowledge Node'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name *</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus
              className={inputCls} placeholder="e.g. Binary Search Tree" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => {
                const m = TYPE_META[t];
                return (
                  <button key={t} onClick={() => setType(t)}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition"
                    style={{
                      background: type === t ? m.color + '22' : 'rgba(255,255,255,0.04)',
                      color: type === t ? m.color : '#64748b',
                      border: `1px solid ${type === t ? m.color + '50' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {m.icon} {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className={inputCls + ' resize-none'} placeholder="What is this about?" />
          </div>

          {linkCandidates.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Link to other nodes</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {linkCandidates.map((n) => {
                  const m = TYPE_META[n.type] || TYPE_META.Concept;
                  const active = links.includes(n.id);
                  return (
                    <button key={n.id} onClick={() => toggleLink(n.id)}
                      className="rounded-full px-2.5 py-1 text-[11px] transition"
                      style={{
                        background: active ? m.color + '22' : 'rgba(255,255,255,0.04)',
                        color: active ? m.color : '#64748b',
                        border: `1px solid ${active ? m.color + '50' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      {m.icon} {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white transition">Cancel</button>
          <button onClick={() => label.trim() && onSave({ label: label.trim(), type, desc: desc.trim(), links })}
            disabled={!label.trim()}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40 transition"
            style={{ background: meta.color }}>
            {node ? 'Save Changes' : 'Add Node'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div className="w-full max-w-xs rounded-2xl p-5 text-center"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.09)' }}
        initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-slate-300 mb-4">Delete this node? Links from other nodes will also be removed.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500/80 py-2 text-sm font-semibold text-white hover:bg-red-500 transition">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Node Card ─────────────────────────────────────────────────────────────────
function NodeCard({ node, selected, allNodes, onSelect, onEdit, onDelete }) {
  const meta = TYPE_META[node.type] || TYPE_META.Concept;
  const linkedNodes = node.links.map((id) => allNodes.find((n) => n.id === id)).filter(Boolean);

  return (
    <motion.div layout
      className="rounded-2xl p-4 cursor-pointer transition"
      style={{
        background: selected ? `${meta.color}12` : '#090e1a',
        border: `1px solid ${selected ? meta.color + '50' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: selected ? `0 0 20px ${meta.color}20` : 'none',
      }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onSelect(node.id)}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-base flex-shrink-0">{meta.icon}</span>
          <div className="min-w-0">
            <p className="font-display font-bold text-white text-sm leading-tight truncate">{node.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: meta.color }}>{node.type}</p>
          </div>
        </div>
        {selected && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              className="rounded-lg p-1 text-xs text-slate-400 hover:text-white hover:bg-white/[0.07] transition">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="rounded-lg p-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition">🗑️</button>
          </div>
        )}
      </div>

      {node.desc && (
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed line-clamp-2">{node.desc}</p>
      )}

      {linkedNodes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {linkedNodes.map((ln) => {
            const lm = TYPE_META[ln.type] || TYPE_META.Concept;
            return (
              <span key={ln.id} className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: lm.color + '15', color: lm.color, border: `1px solid ${lm.color}30` }}>
                {lm.icon} {ln.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-600">{node.links.length} connections</span>
        {selected && <span className="text-[10px]" style={{ color: meta.color }}>● selected</span>}
      </div>
    </motion.div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function TypeBar({ nodes }) {
  const counts = useMemo(() => {
    const c = {};
    nodes.forEach((n) => { c[n.type] = (c[n.type] || 0) + 1; });
    return c;
  }, [nodes]);

  return (
    <div className="flex flex-wrap gap-2">
      {TYPES.filter((t) => counts[t]).map((t) => {
        const m = TYPE_META[t];
        return (
          <span key={t} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
            style={{ background: m.color + '15', color: m.color, border: `1px solid ${m.color}30` }}>
            {m.icon} {t} <strong>{counts[t]}</strong>
          </span>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KnowledgeWorld() {
  const world = WORLDS.find((w) => w.id === 'knowledge');
  const [nodes, setNodes] = useState(load);

  const [selectedId, setSelectedId] = useState(null);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [modal,      setModal]      = useState(null);   // null | 'add' | 'edit' | 'delete'
  const [editNode,   setEditNode]   = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);

  const update = useCallback((updated) => { setNodes(updated); persist(updated); }, []);

  // ── mutations ──
  function addNode(data) {
    const n = { id: uid(), ...data };
    // add bidirectional links
    const updated = [n, ...nodes].map((existing) => {
      if (data.links.includes(existing.id) && !existing.links.includes(n.id)) {
        return { ...existing, links: [...existing.links, n.id] };
      }
      return existing;
    });
    update(updated);
    setSelectedId(n.id);
    setModal(null);
  }

  function saveEdit(data) {
    const updated = nodes.map((n) => {
      if (n.id === editNode.id) return { ...n, ...data };
      // sync bidirectional: if this node now links to n, ensure n links back
      if (data.links.includes(n.id) && !n.links.includes(editNode.id)) {
        return { ...n, links: [...n.links, editNode.id] };
      }
      // if link removed, optionally keep reverse link (non-destructive)
      return n;
    });
    update(updated);
    setModal(null);
    setEditNode(null);
  }

  function deleteNode(id) {
    const updated = nodes
      .filter((n) => n.id !== id)
      .map((n) => ({ ...n, links: n.links.filter((lid) => lid !== id) }));
    update(updated);
    if (selectedId === id) setSelectedId(null);
    setModal(null);
    setDeleteId(null);
  }

  // ── filter + search ──
  const visible = useMemo(() => {
    let list = nodes;
    if (typeFilter !== 'All') list = list.filter((n) => n.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.label.toLowerCase().includes(q) || n.desc?.toLowerCase().includes(q));
    }
    return list;
  }, [nodes, typeFilter, search]);

  const selected = nodes.find((n) => n.id === selectedId);

  // total connections (divide by 2 for unique pairs)
  const totalLinks = Math.round(nodes.reduce((s, n) => s + n.links.length, 0) / 2);

  return (
    <>
      <AnimatePresence>
        {modal === 'add' && (
          <NodeModal allNodes={nodes} onSave={addNode} onClose={() => setModal(null)} />
        )}
        {modal === 'edit' && editNode && (
          <NodeModal node={editNode} allNodes={nodes} onSave={saveEdit} onClose={() => { setModal(null); setEditNode(null); }} />
        )}
        {modal === 'delete' && deleteId && (
          <ConfirmModal onConfirm={() => deleteNode(deleteId)} onClose={() => { setModal(null); setDeleteId(null); }} />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pb-16 space-y-6">

        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
              style={{ backgroundColor: (world?.color || '#a78bfa') + '22', color: world?.color || '#a78bfa' }}>
              {world?.icon || '🧠'}
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-white">Knowledge Observatory</h1>
              <p className="text-xs text-slate-400">Map your mind — concepts, skills, projects and goals in one place.</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModal('add')}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-950"
            style={{ background: '#a78bfa' }}>
            + Add Node
          </motion.button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Nodes',   value: nodes.length,   color: '#a78bfa' },
            { label: 'Concepts',      value: nodes.filter((n) => n.type === 'Concept').length,  color: '#a78bfa' },
            { label: 'Skills',        value: nodes.filter((n) => n.type === 'Skill').length,    color: '#34d399' },
            { label: 'Connections',   value: totalLinks,     color: '#60a5fa' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="font-display text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* type breakdown */}
        <TypeBar nodes={nodes} />

        {/* search + type filter */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] rounded-xl bg-white/[0.05] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20 transition"
            placeholder="🔍  Search nodes…" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 cursor-pointer">
            <option value="All">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* grid */}
        {visible.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: '#090e1a', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-slate-500 text-sm">No nodes match your search.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                selected={selectedId === node.id}
                allNodes={nodes}
                onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                onEdit={(n) => { setEditNode(n); setModal('edit'); }}
                onDelete={(id) => { setDeleteId(id); setModal('delete'); }}
              />
            ))}
          </div>
        )}

        {/* selected node detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="rounded-2xl p-5"
              style={{ background: '#090e1a', border: `1px solid ${(TYPE_META[selected.type] || TYPE_META.Concept).color}35` }}>
              {(() => {
                const meta = TYPE_META[selected.type] || TYPE_META.Concept;
                const linked = selected.links.map((id) => nodes.find((n) => n.id === id)).filter(Boolean);
                const backLinks = nodes.filter((n) => n.links.includes(selected.id) && n.id !== selected.id);
                return (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{meta.icon}</span>
                        <div>
                          <h2 className="font-display font-bold text-white text-lg leading-tight">{selected.label}</h2>
                          <p className="text-xs mt-0.5" style={{ color: meta.color }}>{selected.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditNode(selected); setModal('edit'); }}
                          className="rounded-xl px-3 py-1.5 text-xs text-white hover:bg-white/[0.08] transition"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => { setDeleteId(selected.id); setModal('delete'); }}
                          className="rounded-xl px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,100,100,0.15)' }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {selected.desc && (
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{selected.desc}</p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {linked.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Links to ({linked.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {linked.map((ln) => {
                              const lm = TYPE_META[ln.type] || TYPE_META.Concept;
                              return (
                                <button key={ln.id} onClick={() => setSelectedId(ln.id)}
                                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition hover:scale-105"
                                  style={{ background: lm.color + '18', color: lm.color, border: `1px solid ${lm.color}40` }}>
                                  {lm.icon} {ln.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {backLinks.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Linked by ({backLinks.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {backLinks.map((ln) => {
                              const lm = TYPE_META[ln.type] || TYPE_META.Concept;
                              return (
                                <button key={ln.id} onClick={() => setSelectedId(ln.id)}
                                  className="rounded-full px-2.5 py-1 text-[11px] transition hover:scale-105"
                                  style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}>
                                  {lm.icon} {ln.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
