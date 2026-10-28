import State from '../models/State.js';

export async function getState(req, res, next) {
  try {
    const doc = await State.findOne({ user: req.userId });
    return res.json({ data: doc?.data ?? null, updatedAt: doc?.updatedAt ?? null });
  } catch (e) { return next(e); }
}

export async function putState(req, res, next) {
  try {
    const data = req.body?.data ?? {};
    const doc = await State.findOneAndUpdate({ user: req.userId }, { data }, { new: true, upsert: true });
    return res.json({ updatedAt: doc.updatedAt });
  } catch (e) { return next(e); }
}
