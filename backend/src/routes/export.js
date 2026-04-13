/**
 * Export Routes — PDF Generation using Puppeteer
 * POST /api/export/pdf — Generate PDF from resume HTML
 */

import express from "express";
import puppeteer from "puppeteer";
import { protect } from "../middleware/auth.js";
import { Resume } from "../models/models.js";

const router = express.Router();
router.use(protect);

// ── POST /api/export/pdf ──────────────────────────────────────────────────────
router.post("/pdf", async (req, res) => {
  try {
    const { resumeId, htmlContent } = req.body;

    // Verify ownership if resumeId provided
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (!resume) return res.status(404).json({ error: "Resume not found" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set full page HTML with Google Fonts
    await page.setContent(
      `<!DOCTYPE html>
       <html>
         <head>
           <meta charset="UTF-8"/>
           <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
           <style>
             * { margin:0; padding:0; box-sizing:border-box; }
             body { font-family: 'DM Sans', sans-serif; }
           </style>
         </head>
         <body>${htmlContent}</body>
       </html>`,
      { waitUntil: "networkidle0" }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume-${Date.now()}.pdf"`,
      "Content-Length": pdf.length,
    });

    res.send(pdf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "PDF generation failed: " + err.message });
  }
});

export default router;
