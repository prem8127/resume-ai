/**
 * AI Routes — OpenAI GPT-4 Integration
 *
 * FIX: OpenAI is now lazy-loaded inside the helper function.
 * The server will start successfully even if OPENAI_API_KEY is not yet set.
 * AI routes will return a clear error message instead of crashing.
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 20 AI requests per hour per user
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { error: "AI request limit reached. Try again in an hour." },
});

router.use(protect);
router.use(aiLimiter);

// ── Lazy GPT helper (OpenAI initialized only when first AI call is made) ──────
async function gpt(systemPrompt, userPrompt, maxTokens = 500) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your .env file:\n  OPENAI_API_KEY=sk-proj-..."
    );
  }

  // Dynamic import — safe for ESM, avoids crash at module load time
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

// ── POST /api/ai/objective ────────────────────────────────────────────────────
router.post("/objective", async (req, res) => {
  try {
    const { skills = [], role = "ML Engineer", name = "" } = req.body;
    const result = await gpt(
      "You are an expert resume writer specializing in AI/ML careers. Be concise and ATS-optimized.",
      `Write a 3-sentence career objective for an AI/ML student named ${name || "the candidate"} 
       targeting the role of ${role}. 
       Their skills include: ${skills.join(", ") || "Python, Machine Learning, Deep Learning"}.
       Make it specific, results-oriented, and include keywords hiring managers look for.
       Return ONLY the objective text.`
    );
    res.json({ objective: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/skills ───────────────────────────────────────────────────────
router.post("/skills", async (req, res) => {
  try {
    const { role = "ML Engineer" } = req.body;
    const result = await gpt(
      "You are a technical recruiter specializing in AI/ML roles.",
      `List the top skills for a ${role} in 2025. Return ONLY valid JSON with no extra text:
       {"languages":["Python","R"],"frameworks":["TensorFlow","PyTorch","scikit-learn"],
        "tools":["Git","Docker","Jupyter"],"databases":["PostgreSQL","MongoDB"],
        "cloud":["AWS SageMaker","GCP Vertex AI"],"soft":["Problem Solving","Communication"]}
       Include 5-8 items per category.`,
      600
    );
    const cleaned = result.replace(/```json|```/g, "").trim();
    res.json({ skills: JSON.parse(cleaned) });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate skills: " + err.message });
  }
});

// ── POST /api/ai/improve ──────────────────────────────────────────────────────
router.post("/improve", async (req, res) => {
  try {
    const { text, type = "bullet", context = "" } = req.body;
    const prompts = {
      bullet: `Rewrite these bullet points using STAR format with strong action verbs and quantified results.
               Context: ${context}. Original: ${text}
               Return 3-4 improved bullet points starting with •. Each should have a measurable outcome.`,
      objective: `Improve this career objective to be more impactful and ATS-friendly: "${text}"
                  Return only the improved objective text.`,
    };
    const result = await gpt(
      "You are an expert resume writer. Make every word count.",
      prompts[type] || prompts.bullet
    );
    res.json({ improved: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/ats ──────────────────────────────────────────────────────────
router.post("/ats", async (req, res) => {
  try {
    const { resumeData, targetRole = "ML Engineer" } = req.body;
    const resumeText = `
      Skills: ${Object.values(resumeData.skills || {}).flat().join(", ")}
      Projects: ${(resumeData.projects || []).map((p) => p.title + " " + p.description).join(". ")}
      Experience: ${(resumeData.internships || []).map((i) => i.role + " " + i.description).join(". ")}
    `.substring(0, 1200);

    const result = await gpt(
      "You are an ATS (Applicant Tracking System) expert. Always return valid JSON only.",
      `Analyze this resume for ATS optimization targeting ${targetRole} roles.
       Resume content: ${resumeText}
       
       Return ONLY valid JSON with no extra text:
       {
         "score": 72,
         "missing_keywords": ["MLOps", "A/B Testing", "CI/CD"],
         "present_keywords": ["Python", "TensorFlow"],
         "strengths": ["Clear technical skills section"],
         "improvements": ["Add quantified metrics to projects"],
         "recommended_keywords": ["Feature Engineering", "Model Deployment"]
       }`,
      700
    );
    const cleaned = result.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    res.status(500).json({ error: "ATS analysis failed: " + err.message });
  }
});

export default router;