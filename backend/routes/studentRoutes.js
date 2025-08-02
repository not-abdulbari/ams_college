// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const sequelize = require("../config/db"); // our Sequelize instance from db.js
const { QueryTypes } = require("sequelize");
const jwt = require("jsonwebtoken");


/**
 * @swagger
 * /api/students/details:
 *   get:
 *     summary: Get student details by roll number (query)
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Student roll number
 *     responses:
 *       200:
 *         description: Student details
 *       400:
 *         description: rollNumber is required
 *       404:
 *         description: Student not found
 */
router.get('/details', async (req, res) => {
  try {
    const { rollNumber } = req.query;
    if (!rollNumber) {
      return res.status(400).json({ error: 'rollNumber is required' });
    }
    const [student] = await sequelize.query(
      'SELECT * FROM students WHERE rollNumber = ?',
      {
        replacements: [rollNumber],
        type: QueryTypes.SELECT,
      }
    );
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



/**
 * @swagger
 * /api/students/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rollNumber:
 *                 type: string
 *               dob:
 *                 type: string
 *               registerNumber:
 *                 type: string
 *               branch:
 *                 type: string
 *               section:
 *                 type: string
 *               batchYear:
 *                 type: string
 *               yearOfEntry:
 *                 type: string
 *               ...
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       500:
 *         description: Database error
 */
router.post("/register", async (req, res) => {
  const {
    name,
    rollNumber,
    dob,
    registerNumber,
    branch,
    section,
    batchYear,
    yearOfEntry,
    fatherName,
    fatherOccupation,
    educationOccupation,
    familyBackground,
    parentPhoneNo,
    address,
    languagesKnown,
    guardianName,
    lastSchoolName,
    mediumOfInstructions,
    maths,
    physics,
    chemistry,
    cutOff,
    quota,
    firstYearCounselor,
    secondYearCounselor,
    thirdYearCounselor,
    finalYearCounselor,
  } = req.body;

  // Create timestamps for createdAt and updatedAt
  const createdAt = new Date();
  const updatedAt = new Date();

  // Define the SQL query with placeholders
  const query = `
    INSERT INTO students (
      name, rollNumber, dob, registerNumber, branch, section, batchYear, yearOfEntry,
      fatherName, fatherOccupation, educationOccupation, familyBackground, parentPhoneNo,
      address, languagesKnown, guardianName, lastSchoolName, mediumOfInstructions,
      maths, physics, chemistry, cutOff, quota, firstYearCounselor, secondYearCounselor,
      thirdYearCounselor, finalYearCounselor, createdAt, updatedAt
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  // Prepare the array of values in the same order as the placeholders above.
  const values = [
    name,
    rollNumber,
    dob,
    registerNumber,
    branch,
    section,
    batchYear,
    yearOfEntry,
    fatherName,
    fatherOccupation,
    educationOccupation,
    familyBackground,
    parentPhoneNo,
    address,
    languagesKnown,
    guardianName,
    lastSchoolName,
    mediumOfInstructions,
    maths,
    physics,
    chemistry,
    cutOff,
    quota,
    firstYearCounselor,
    secondYearCounselor,
    thirdYearCounselor,
    finalYearCounselor,
    createdAt,
    updatedAt,
  ];

  try {
    // Execute the raw query with replacements.
    const [result] = await sequelize.query(query, {
      replacements: values,
      type: QueryTypes.INSERT,
    });

    // Depending on the dialect, result might contain the inserted ID.
    res.status(201).json({
      message: "Student registered successfully",
      studentId: result, // may need to adjust based on your MySQL/Sequelize version
    });
  } catch (error) {
    console.error("Error inserting student:", error);
    res.status(500).json({ error: "Database error" });
  }
});


/**
 * @swagger
 * /api/students/login:
 *   post:
 *     summary: Student login
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rollNumber:
 *                 type: string
 *               dob:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Roll number and DOB are required
 *       401:
 *         description: Invalid roll number or DOB
 */
router.post("/login", async (req, res) => {
  const { rollNumber, dob } = req.body;

  if (!rollNumber || !dob) {
    return res.status(400).json({ message: "Roll number and DOB are required" });
  }

  try {
    // Find student in database
    const [students] = await sequelize.query(
      "SELECT * FROM students WHERE rollNumber = ? AND dob = ?",
      {
        replacements: [rollNumber, dob],
        type: QueryTypes.SELECT,
      }
    );

    if (!students) {
      return res.status(401).json({ message: "Invalid roll number or DOB" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: students.id, rollNumber: students.rollNumber, name: students.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      studentDetails: {
        id: students.id,
        name: students.name,
        rollNumber: students.rollNumber,
        dob: students.dob,
        branch: students.branch,
        section: students.section,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * @swagger
 * /api/students/marks:
 *   get:
 *     summary: Get student marks by roll number
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Student roll number
 *     responses:
 *       200:
 *         description: Student marks
 *       400:
 *         description: Missing rollNumber
 *       404:
 *         description: Student not found
 */
router.get("/marks", async (req, res) => {
  try {
    const { rollNumber } = req.query;
    if (!rollNumber) {
      return res.status(400).json({ error: "Missing rollNumber" });
    }

    // First, fetch student details (branch and batchYear) using the rollNumber.
    const student = await sequelize.query(
      "SELECT branch, batchYear FROM students WHERE rollNumber = ?",
      {
        replacements: [rollNumber],
        type: QueryTypes.SELECT,
      }
    );

    if (!student || student.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const { branch, batchYear } = student[0];

    // Now, query all subjects for the student's branch and batchYear
    // and left join with the Marks table on subject_code and rollNumber.
    const results = await sequelize.query(
      `SELECT 
          s.subject_code, 
          s.subject_name, 
          s.semester,
          COALESCE(m.cat1_marks, '') AS cat1,
          COALESCE(m.cat2_marks, '') AS cat2,
          COALESCE(m.model_marks, '') AS model
       FROM subjects s
       LEFT JOIN marks m 
         ON s.subject_code = m.subject_code 
         AND m.rollNumber = :rollNumber
       WHERE s.branch = :branch 
         AND s.batchYear = :batchYear
       ORDER BY s.semester, s.subject_code`,
      {
        replacements: { rollNumber, branch, batchYear },
        type: QueryTypes.SELECT,
      }
    );

    res.json(results);
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
/**
 * @swagger
 * /api/students/attendance:
 *   get:
 *     summary: Get student attendance by roll number
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Student roll number
 *     responses:
 *       200:
 *         description: Student attendance
 *       400:
 *         description: Missing rollNumber
 *       404:
 *         description: Student not found
 */
router.get("/attendance", async (req, res) => {
  try {
    const { rollNumber } = req.query;
    if (!rollNumber) return res.status(400).json({ error: "Missing rollNumber" });

    // Get student details
    const [student] = await sequelize.query(
      `SELECT branch, batchYear FROM students WHERE rollNumber = ?`,
      { replacements: [rollNumber], type: QueryTypes.SELECT }
    );
    if (!student) return res.status(404).json({ error: "Student not found" });

    const { branch, batchYear } = student;

    // Updated SQL using MAX for JSON_TABLE values
    const results = await sequelize.query(
      `WITH combined_data AS (
          SELECT 
            s.subject_code,
            s.subject_name,
            s.semester,
            COALESCE(
              MAX(CASE WHEN ap.entry = 'Entry1' AND ap.subject_code != 'ALL' THEN ap.percentage END),
              MAX(subj_breakdown.percentage)
            ) AS entry1,
            COALESCE(
              MAX(CASE WHEN ap.entry = 'Entry2' AND ap.subject_code != 'ALL' THEN ap.percentage END),
              MAX(subj_breakdown.percentage)
            ) AS entry2,
            MAX(CASE WHEN ap.subject_code = 'ALL' THEN ap.percentage END) AS overall
          FROM subjects s
          LEFT JOIN attendance_percentage ap 
            ON s.subject_code = ap.subject_code
            AND ap.roll_number = ?
            AND ap.branch = ?
            AND ap.academic_year = ?
            AND ap.semester = s.semester
          LEFT JOIN JSON_TABLE(
            IFNULL(ap.subject_breakdown, '[]'),
            '$[*]' COLUMNS (
              subject_code VARCHAR(50) PATH '$.subject_code',
              percentage DECIMAL(5,2) PATH '$.percentage'
            )
          ) AS subj_breakdown
            ON subj_breakdown.subject_code COLLATE utf8mb4_unicode_ci = s.subject_code COLLATE utf8mb4_unicode_ci
          WHERE s.branch = ? AND s.batchYear = ?
          GROUP BY s.semester, s.subject_code, s.subject_name
        )
        SELECT 
          semester,
          subject_code,
          subject_name,
          MAX(entry1) AS entry1,
          MAX(entry2) AS entry2,
          MAX(overall) AS overall
        FROM combined_data
        GROUP BY semester, subject_code, subject_name
        ORDER BY semester, subject_code`,
      {
        replacements: [rollNumber, branch, batchYear, branch, batchYear],
        type: QueryTypes.SELECT
      }
    );

    // Process into frontend-friendly format
    const attendanceData = results.reduce((acc, row) => {
      const sem = row.semester;
      if (!acc[sem]) acc[sem] = { subjects: [], total: { entry1: null, entry2: null } };

      acc[sem].subjects.push({
        subject_code: row.subject_code,
        subject_name: row.subject_name,
        entry1: row.entry1,
        entry2: row.entry2
      });

      // Set total from ALL subjects record if available
      if (row.overall) {
        acc[sem].total = {
          entry1: row.overall,
          entry2: row.overall
        };
      }

      return acc;
    }, {});

    // Calculate averages where the ALL record doesn't exist
    Object.values(attendanceData).forEach(sem => {
      if (sem.total.entry1 === null) {
        const entry1Avg = sem.subjects.reduce((sum, s) => sum + (s.entry1 || 0), 0) / sem.subjects.length;
        const entry2Avg = sem.subjects.reduce((sum, s) => sum + (s.entry2 || 0), 0) / sem.subjects.length;
        sem.total = {
          entry1: entry1Avg,
          entry2: entry2Avg
        };
      }
    });

    res.json(attendanceData);
  } catch (error) {
    console.error("attendance fetch error:", error.message, error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});



/// Get student details
/**
 * @swagger
 * /api/students/{rollNumber}:
 *   get:
 *     summary: Get student details by roll number (path)
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Student roll number
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/:rollNumber', async (req, res) => {
  try {
    // Use Sequelize to query the database
    const [student, metadata] = await sequelize.query(
      'SELECT * FROM students WHERE rollNumber = ?',
      {
        replacements: [req.params.rollNumber], // Use replacements for parameterized queries
        type: QueryTypes.SELECT, // Specify the query type
      }
    );

    // If no student is found, return a 404 error
    if (!student || student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Return the first student (since rollNumber is unique)
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

 

module.exports = router;