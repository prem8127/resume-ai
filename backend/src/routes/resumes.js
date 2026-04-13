/**
 * Resume Routes: Full CRUD
 * GET /api/resumes — list user's resumes
 * POST /api/resumes — create new
 * GET /api/resumes/:id — get one
 * PUT /api/resumes/:id — update
 * DELETE /api/resumes/:id — delete
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import { Resume } from "../models/models.js";
import crypto from "crypto";

const router = express.Router();

// All routes require authentication
router.use(protect);

// List all resumes for current user
router.get("/", async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  res.json(resumes);
});

// Create resume
router.post("/", async (req, res) => {
  try {
    const resume = await Resume.create({ ...req.body, userId: req.user._id });
    res.status(201).json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get specific resume (owner check)
router.get("/:id", async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
  if (!resume) return res.status(404).json({ error: "Resume not found" });
  res.json(resume);
});

// Update resume
router.put("/:id", async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, userId: req.user._id }, // prevent userId override
      { new: true, runValidators: true }
    );
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete resume
router.delete("/:id", async (req, res) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!resume) return res.status(404).json({ error: "Resume not found" });
  res.json({ message: "Resume deleted" });
});

// Generate shareable link
router.post("/:id/share", async (req, res) => {
  const shareToken = crypto.randomBytes(16).toString("hex");
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isPublic: true, shareToken },
    { new: true }
  );
  if (!resume) return res.status(404).json({ error: "Resume not found" });
  res.json({ shareUrl: `${process.env.CLIENT_URL}/r/${shareToken}` });
});

// Public resume view via share token
router.get("/public/:token", async (req, res) => {
  const resume = await Resume.findOne({ shareToken: req.params.token, isPublic: true });
  if (!resume) return res.status(404).json({ error: "Resume not found or not public" });
  res.json(resume);
});

export default router;
