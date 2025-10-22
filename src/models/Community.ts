import mongoose, { Schema, Document, Types } from 'mongoose';
import Counter from './Counter.js';

export interface IBranding {
  primaryColor: string;
  logoUrl: string;
}

export interface ICommunityMember {
  userId: number;
  role: 'civ' | 'leo' | 'dispatch' | 'fire' | 'admin';
  joinedAt: Date;
}

export interface ICommunity extends Document {
  _id: number; // numeric ID
  name: string;
  description?: string;
  members: ICommunityMember[];
  branding: IBranding;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityMemberSchema = new Schema<ICommunityMember>({
  userId: { type: Number, required: true },
  role: { type: String, enum: ['civ', 'leo', 'dispatch', 'fire', 'admin'], required: true },
  joinedAt: { type: Date, default: Date.now },
});

const BrandingSchema = new Schema<IBranding>({
  primaryColor: { type: String, default: '#4f46e5' }, // default purple
  logoUrl: { type: String, default: '' }, // optional logo URL
});

const CommunitySchema = new Schema<ICommunity>(
  {
    _id: { type: Number },
    name: { type: String, required: true },
    description: { type: String },
    members: [CommunityMemberSchema],
    branding: { type: BrandingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Auto-increment numeric _id
CommunitySchema.pre('validate', async function (next) {
  if (this.isNew && !this._id) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'communityId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this._id = counter.seq;
  }
  next();
});

const Community = mongoose.model<ICommunity>('Community', CommunitySchema);
export default Community;
