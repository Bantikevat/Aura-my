import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';

async function canAccess(workspaceId, userId) { return Workspace.exists({ _id: workspaceId, $or: [{ owner: userId }, { members: userId }] }); }
export async function listTasks(req, res, next) { try { if (!(await canAccess(req.params.workspaceId, req.userId))) return res.status(403).json({ message: 'Workspace access denied.' }); return res.json(await Task.find({ workspace: req.params.workspaceId }).populate('assignee', 'name avatarColor').sort({ createdAt: -1 })); } catch (e) { return next(e); } }
export async function createTask(req, res, next) { try { if (!(await canAccess(req.params.workspaceId, req.userId))) return res.status(403).json({ message: 'Workspace access denied.' }); const task = await Task.create({ ...req.body, workspace: req.params.workspaceId }); return res.status(201).json(task); } catch (e) { return next(e); } }
export async function updateTask(req, res, next) { try { const task = await Task.findById(req.params.taskId); if (!task || !(await canAccess(task.workspace, req.userId))) return res.status(404).json({ message: 'Task not found.' }); Object.assign(task, req.body); await task.save(); return res.json(task); } catch (e) { return next(e); } }
export async function deleteTask(req, res, next) { try { const task = await Task.findById(req.params.taskId); if (!task || !(await canAccess(task.workspace, req.userId))) return res.status(404).json({ message: 'Task not found.' }); await task.deleteOne(); return res.status(204).end(); } catch (e) { return next(e); } }
