import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter.js';

export interface IUser extends Document {
  _id: number; // numeric ID
  username: string;
  email: string;
  passwordHash: string;
  communities: number[]; // references to Community IDs (numeric)
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    _id: { type: Number }, // will be set by counter
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    communities: [{ type: Number, ref: 'Community' }] // numeric references
  },
  { timestamps: true }
);

// Generate numeric _id before validation
UserSchema.pre('validate', async function (next) {
  if (this.isNew && !this._id) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'userId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this._id = counter.seq;
  }
  next();
});

// Compare password helper
UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
