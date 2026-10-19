import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  avatarColor: { type: String, default: '#8be7ff' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
