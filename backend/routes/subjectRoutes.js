const express = require("express");
const router = express.Router();
const sequelize = require("../config/db"); // Sequelize instance
const { QueryTypes } = require("sequelize");

/**
 * @swagger
 * /api/subjects/adminlist:
 *   get:
 *     summary: Get all subjects (admin)
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: List of all subjects
 */
router.get('/adminlist', async (req, res) => {
  try {
    const subjects = await sequelize.query(
      'SELECT * FROM subjects ORDER BY batchYear, semester',
      { type: QueryTypes.SELECT }
    );
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/subjects/list:
 *   get:
 *     summary: Get subjects by branch, batchYear, and semester
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         required: true
 *         description: Branch name
 *       - in: query
 *         name: batchYear
 *         schema:
 *           type: string
 *         required: true
 *         description: Batch year
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         required: true
 *         description: Semester
 *     responses:
 *       200:
 *         description: List of subjects for the given branch, batchYear, and semester
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: No subjects found
 */
router.get('/list', async (req, res) => {
  try {
    const { batchYear, semester, branch } = req.query;

    if (!branch || !batchYear || !semester) {
      return res.status(400).json({ error: "semester, branch, batchYear are required" });
    }

    const subjects = await sequelize.query(
      'SELECT * FROM subjects WHERE branch = ? AND batchYear = ? AND semester = ? ORDER BY semester',
      {
        replacements: [branch, batchYear, semester], // Pass query parameters safely
        type: QueryTypes.SELECT, // Ensure it returns an array of objects
      }
    );

    if (subjects.length === 0) {
      return res.status(404).json({ error: "No subjects found for the given branch and batchYear" });
    }

    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


/**
 * @swagger
 * /api/subjects/{subjectCode}:
 *   get:
 *     summary: Get subject details by subject code
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: subjectCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Subject code
 *     responses:
 *       200:
 *         description: Subject details
 *       404:
 *         description: Subject not found
 */
router.get("/:subjectCode", async (req, res) => {
  try {
    // Normalize the subject code to uppercase and trim spaces
    const subjectCode = req.params.subjectCode.trim().toUpperCase();
    
    const subject = await sequelize.query(
      `SELECT subject_code, subject_name 
       FROM subjects 
       WHERE subject_code = ?`,
      {
        replacements: [subjectCode],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!subject || subject.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `Subject with code ${subjectCode} not found` 
      });
    }

    // Return the subject name along with subject code
    res.json({
      success: true,
      subject_code: subject[0].subject_code,
      subject_name: subject[0].subject_name
    });
  } catch (error) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get subjects by branch and batchYear
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         required: true
 *         description: Branch name
 *       - in: query
 *         name: batchYear
 *         schema:
 *           type: string
 *         required: true
 *         description: Batch year
 *     responses:
 *       200:
 *         description: List of subjects for the given branch and batchYear
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: No subjects found
 */
router.get('/', async (req, res) => {
  try {
    const { branch, batchYear} = req.query;

    if (!branch || !batchYear) {
      return res.status(400).json({ error: "Both branch and batchYear are required" });
    }

    const subjects = await sequelize.query(
      'SELECT * FROM subjects WHERE branch = ? AND batchYear = ? ORDER BY semester',
      {
        replacements: [branch, batchYear], // Pass query parameters safely
        type: QueryTypes.SELECT, // Ensure it returns an array of objects
      }
    );

    if (subjects.length === 0) {
      return res.status(404).json({ error: "No subjects found for the given branch and batchYear" });
    }

    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
