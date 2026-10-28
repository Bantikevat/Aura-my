import { motion } from 'framer-motion';
import { useAuraStore, WORLDS } from '../store/useAuraStore';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const demoProjects = [
  {
    id: 'p1',
    name: 'AURA — Personal AI OS',
    status: 'active',
    progress: 15,
    color: '#e8c872',
    milestones: [
      { name: 'Phase 0 — Foundation', status: 'done' },
      { name: 'Phase 1 — Virtual Universe', status: 'progress' },
      { name: 'Phase 2 — Task Manager', status: 'pending' },
      { name: 'Phase 3 — AI Core', status: 'pending' },
    ],
    tech: ['React', 'Three.js', 'Node.js', 'MongoDB'],
    lastActivity: '2 hours ago',
  },
  {
    id: 'p2',
    name: 'Portfolio Website',
    status: 'active',
    progress: 65,
    color: '#a78bfa',
    milestones: [
      { name: 'Design System', status: 'done' },
      { name: 'Hero + About', status: 'done' },
      { name: 'Projects Section', status: 'progress' },
      { name: 'Deploy', status: 'pending' },
    ],
    tech: ['Next.js', 'Tailwind', 'Framer Motion'],
    lastActivity: '1 day ago',
  },
  {
    id: 'p3',
    name: 'E-Commerce API',
    status: 'paused',
    progress: 40,
    color: '#34d399',
    milestones: [
      { name: 'Auth + Users', status: 'done' },
      { name: 'Products CRUD', status: 'done' },
      { name: 'Cart + Orders', status: 'progress' },
      { name: 'Payment Integration', status: 'pending' },
    ],
    tech: ['Express', 'PostgreSQL', 'Stripe'],
    lastActivity: '5 days ago',
  },
];

const milestoneIcons = {
  done: { color: '#34d399', icon: '✓' },
  progress: { color: '#fbbf24', icon: '⟳' },
  pending: { color: '#475569', icon: '○' },
};

export default function ProjectWorld() {
  const world = WORLDS.find((w) => w.id === 'project');
  const allTasks = useAuraStore((s) => s.tasks);
  const tasks = allTasks.filter((task) => task.worldId === 'project' && task.status !== 'done');

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: world.color + '18', color: world.color }}
          >
            {world.icon}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{world.name}</h1>
            <p className="text-sm text-slate-400">{world.subtitle}</p>
          </div>
        </div>
      </motion.div>

      {/* Project stats */}
      <motion.div variants={fadeUp} className="mb-8 grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="stat-label">Active projects</p>
          <p className="stat-value text-mint">{demoProjects.filter((p) => p.status === 'active').length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Milestones done</p>
          <p className="stat-value text-ice">
            {demoProjects.reduce((acc, p) => acc + p.milestones.filter((m) => m.status === 'done').length, 0)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In progress</p>
          <p className="stat-value text-solar">
            {demoProjects.reduce((acc, p) => acc + p.milestones.filter((m) => m.status === 'progress').length, 0)}
          </p>
        </div>
      </motion.div>

      {/* Project cards */}
      <motion.section variants={fadeUp} className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Projects</h2>
        <div className="space-y-4">
          {demoProjects.map((project) => (
            <motion.div
              key={project.id}
              className="glass-strong overflow-hidden rounded-2xl"
              whileHover={{ scale: 1.005 }}
            >
              {/* Project header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <h3 className="font-display text-base font-semibold text-white">
                        {project.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Last activity: {project.lastActivity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                        project.status === 'active'
                          ? 'bg-mint/10 text-mint'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {project.status}
                    </span>
                    <p className="mt-2 font-display text-lg font-bold" style={{ color: project.color }}>
                      {project.progress}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: project.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>

                {/* Tech stack */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div className="border-t border-white/[0.04] bg-black/20 px-5 py-4">
                <p className="section-label mb-3">Milestones</p>
                <div className="space-y-2">
                  {project.milestones.map((milestone, idx) => {
                    const m = milestoneIcons[milestone.status];
                    return (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                          style={{ backgroundColor: m.color + '18', color: m.color }}
                        >
                          {m.icon}
                        </span>
                        <span className={milestone.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}>
                          {milestone.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Project tasks */}
      {tasks.length > 0 && (
        <motion.section variants={fadeUp}>
          <h2 className="mb-4 font-display text-lg font-semibold">Development tasks</h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 text-sm">
                <span className={`status-dot ${task.status === 'progress' ? 'active' : 'pending'}`} />
                <span className="flex-1 text-slate-300">{task.title}</span>
                <span className="text-xs text-slate-500">{task.due}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
