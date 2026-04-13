/**
 * MongoDB Schemas — User & Resume
 * Using Mongoose ODM
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── User Schema ───────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    resumeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Don't return password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model("User", userSchema);

// ── Resume Schema ─────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  tech: String,
  github: String,
  demo: String,
});

const internshipSchema = new mongoose.Schema({
  company: String,
  role: String,
  duration: String,
  description: String,
});

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  field: String,
  year: String,
  gpa: String,
});

const certificationSchema = new mongoose.Schema({
  name: String,
  issuer: String,
  date: String,
  url: String,
});

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "My Resume" },
    template: { type: String, enum: ["modern", "minimal", "executive"], default: "modern" },

    personal: {
      name: String,
      email: String,
      phone: String,
      location: String,
      github: String,
      linkedin: String,
      portfolio: String,
    },

    objective: { type: String, maxlength: 1000 },

    skills: {
      languages: [String],
      frameworks: [String],
      tools: [String],
      databases: [String],
      cloud: [String],
      soft: [String],
    },

    projects: [projectSchema],
    internships: [internshipSchema],
    education: [educationSchema],
    certifications: [certificationSchema],
    achievements: [String],

    atsScore: { type: Number, min: 0, max: 100 },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String },
  },
  { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);
