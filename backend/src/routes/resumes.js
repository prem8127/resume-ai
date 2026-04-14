/**
 * Resume Routes: Full CRUD
 */

import express from "express";
import crypto from "crypto";
import { protect } from "../middleware/auth.js";
import { prisma } from "../server.js";

const router = express.Router();
router.use(protect);

// List all resumes for current user
router.get("/", async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create resume
router.post("/", async (req, res) => {
  try {
    const { title, template, personal, objective, skills, projects, internships, education, certifications, achievements } = req.body;
    const resume = await prisma.resume.create({
      data: {
        userId: req.user.id,
        title, template, personal, objective, skills,
        projects, internships, education, certifications, achievements,
      },
    });
    res.status(201).json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get specific resume
router.get("/:id", async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update resume
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: "Resume not found" });

    const { title, template, personal, objective, skills, projects, internships, education, certifications, achievements, atsScore } = req.body;
    const resume = await prisma.resume.update({
      where: { id: req.params.id },
      data: { title, template, personal, objective, skills, projects, internships, education, certifications, achievements, atsScore },
    });
    res.json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete resume
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: "Resume not found" });
    await prisma.resume.delete({ where: { id: req.params.id } });
    res.json({ message: "Resume deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate shareable link
router.post("/:id/share", async (req, res) => {
  try {
    const shareToken = crypto.randomBytes(16).toString("hex");
    const resume = await prisma.resume.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isPublic: true, shareToken },
    });
    if (!resume.count) return res.status(404).json({ error: "Resume not found" });
    res.json({ shareUrl: `${process.env.CLIENT_URL}/r/${shareToken}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public resume via share token
router.get("/public/:token", async (req, res) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { shareToken: req.params.token, isPublic: true },
    });
    if (!resume) return res.status(404).json({ error: "Resume not found or not public" });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;