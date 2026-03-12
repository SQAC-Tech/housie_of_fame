import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMember {
  name: string;
  email: string;
  collegeEmail: string;
  regNo: string;
  phone: string;
}

export interface ITeam extends Document {
  teamId: string;
  teamName: string;
  teamLeader: IMember;
  members: IMember[];
  teamSize: number;
  amountPaid: number;
  paymentId: string;
  orderId: string;
  paymentStatus: 'PAID' | 'FAILED' | 'REFUNDED';
  attendance: {
    present: boolean;
    checkedAt: Date | null;
  };
  createdAt: Date;
}

const MemberSchema = new Schema<IMember>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  collegeEmail: { type: String, required: true },
  regNo: { type: String, required: true },
  phone: { type: String, required: true },
});

const TeamSchema = new Schema<ITeam>(
  {
    teamId: { type: String, required: true, unique: true },
    teamName: { type: String, required: true },
    teamLeader: { type: MemberSchema, required: true },
    members: { type: [MemberSchema], default: [] },
    teamSize: { type: Number, required: true, min: 2, max: 3 },
    amountPaid: { type: Number, required: true },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'FAILED', 'REFUNDED'],
      default: 'PAID',
    },
    attendance: {
      present: { type: Boolean, default: false },
      checkedAt: { type: Date, default: null }
    },
  },
  { timestamps: true }
);

// Unique index on leader email to prevent duplicate registrations
TeamSchema.index({ 'teamLeader.email': 1 }, { unique: true });

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
