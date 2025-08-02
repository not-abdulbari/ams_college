// botRoutes.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const sequelize = require("../config/db");

// Enhanced Gemini API Handler
const handleGeminiRequest = async (prompt) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 25000
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "AI service unavailable");
  }
};
/**
 * @swagger
 * /api/ask:
 *   post:
 *     summary: Ask a question to the Gemini AI bot (by subject name)
 *     tags: [Bot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Gemini AI response
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Subject not found
 */
router.post("/", async (req, res) => {
  try {
    // Expect the client to send subject (now the subject name)
    const { subject, messages } = req.body;
    
    // Validate request parameters
    if (!subject || !messages?.length) {
      return res.status(400).json({
        success: false,
        error: "Invalid request parameters"
      });
    }

    // Verify subject exists using subject name
    const [subjectData] = await sequelize.query(
      "SELECT subject_name FROM subjects WHERE subject_name = ? LIMIT 1",
      { replacements: [subject], type: sequelize.QueryTypes.SELECT }
    );

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        error: "Subject not found"
      });
    }

    // Construct prompt using subject name
    const lastMessage = messages[messages.length - 1].content;
    const prompt = [
      `You are a ${subjectData.subject_name} expert assistant.`,
      "Follow these rules strictly:",
      `1. Answer directly about ${subjectData.subject_name}`,
      "2. Never mention your AI nature",
      "3. Use markdown formatting",
      `Question: ${lastMessage}`,
      "Answer:"
    ].join("\n");

    // Get Gemini response
    const responseText = await handleGeminiRequest(prompt);
    
    res.json({
      success: true,
      response: responseText
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      solution: "Check your API key and network connection"
    });
  }
});

module.exports = router;