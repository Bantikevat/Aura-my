import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

const tokenFor = user => jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const response = user => ({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, avatarColor: user.avatarColor } });

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account already exists for this email.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    await Workspace.create({ name: `${name}'s workspace`, owner: user._id, members: [user._id] });
    return res.status(201).json(response(user));
  } catch (error) { return next(error); }
}

export async function login(req, res, next) {
  try { const user = await User.findOne({ email: req.body.email?.toLowerCase() }); if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password.' }); return res.json(response(user)); }
  catch (error) { return next(error); }
}

export async function me(req, res, next) { try { const user = await User.findById(req.userId).select('-password'); if (!user) return res.status(404).json({ message: 'User not found.' }); return res.json(user); } catch (error) { return next(error); } }
