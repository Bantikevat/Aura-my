import Workspace from '../models/Workspace.js';
export async function listWorkspaces(req, res, next) { try { res.json(await Workspace.find({ $or: [{ owner: req.userId }, { members: req.userId }] }).sort({ createdAt: -1 })); } catch (e) { next(e); } }
export async function createWorkspace(req, res, next) { try { const { name, color } = req.body; res.status(201).json(await Workspace.create({ name, color, owner: req.userId, members: [req.userId] })); } catch (e) { next(e); } }
