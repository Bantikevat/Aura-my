import mongoose from 'mongoose';

// One synced snapshot of the whole AURA workspace per user (tasks, profile, flashcards, exam plan…).
const stateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('State', stateSchema);
