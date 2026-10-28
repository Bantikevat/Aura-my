import { motion } from 'framer-motion';
import { useAuraStore, WORLDS } from '../store/useAuraStore';
import JobApplicationAssistant from '../components/JobApplicationAssistant';
import ApplicationCockpit from '../components/ApplicationCockpit';
import MockInterviewArena from '../components/MockInterviewArena';
import SkillDNA from '../components/SkillDNA';
import JobBoard from '../components/JobBoard';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function CareerWorld() {
  const world = WORLDS.find((w) => w.id === 'career');
  const allTasks = useAuraStore((s) => s.tasks);
  const tasks = allTasks.filter((task) => task.worldId === 'career' && task.status !== 'done');

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

      <motion.div variants={fadeUp}>
        <MockInterviewArena />
        <ApplicationCockpit />
        <JobApplicationAssistant />
      </motion.div>

      <motion.div variants={fadeUp}>
        <SkillDNA />
      </motion.div>

      {/* Live job board — real listings from a free API */}
      <motion.div variants={fadeUp}>
        <JobBoard />
      </motion.div>

      {/* Career tasks */}
      {tasks.length > 0 && (
        <motion.section variants={fadeUp}>
          <h2 className="mb-4 font-display text-lg font-semibold">Career tasks</h2>
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
