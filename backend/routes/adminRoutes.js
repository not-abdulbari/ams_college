const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

// —— Helper sorting functions (unchanged) ——

function customRollSort(a, b) {
  const rollA = String(a.rollNumber || a.roll_number).trim();
  const rollB = String(b.rollNumber || b.roll_number).trim();
  const aHasR = /r/i.test(rollA);
  const bHasR = /r/i.test(rollB);
  if (aHasR && !bHasR) return 1;
  if (!aHasR && bHasR) return -1;
  const numA = parseInt(rollA.replace(/\D/g, ''), 10) || 0;
  const numB = parseInt(rollB.replace(/\D/g, ''), 10) || 0;
  return numA - numB;
}

function compositeSort(dayField) {
  return (a, b) => {
    if (a.batchYear !== b.batchYear) return a.batchYear - b.batchYear;
    if (a.branch !== b.branch) return String(a.branch).localeCompare(b.branch);
    if (a.section !== b.section) return String(a.section).localeCompare(b.section);
    if (dayField && a[dayField] !== b[dayField]) {
      return a[dayField] < b[dayField] ? -1 : 1;
    }
    return customRollSort(a, b);
  };
}

// 1️⃣ Day-wise
/**
 * @swagger
 * /api/admin/attendance/day:
 *   get:
 *     summary: Get day-wise attendance
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         required: true
 *         description: Date (YYYY-MM-DD)
 *       - in: query
 *         name: entry
 *         schema:
 *           type: string
 *         required: true
 *         description: Entry type (FN/AN)
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         required: false
 *         description: Branch
 *       - in: query
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: false
 *         description: Roll number
 *     responses:
 *       200:
 *         description: Day-wise attendance
 */
router.get('/attendance/day', async (req, res, next) => {
  const { date, entry, branch, rollNumber } = req.query;
  const period = entry === 'AN' ? 5 : 1;

  try {
    const sql = `
      SELECT
        a.rollNumber  AS roll_number,
        s.name        AS student_name,
        a.branch,
        a.section,
        s.batchYear AS batchYear,
        a.record
      FROM attendance a
      JOIN students s ON a.rollNumber = s.rollNumber
      WHERE a.attendance_date = :date
        AND a.period = :period
        ${branch ? 'AND a.branch     = :branch' : ''}
        ${rollNumber ? 'AND a.rollNumber = :rollNumber' : ''}
    `;

    const rows = await sequelize.query(sql, {
      replacements: { date, period, branch, rollNumber },
      type: QueryTypes.SELECT
    });

    // de-duplicate per roll and sort
    const sorted = rows.sort(compositeSort());
    const unique = [];
    const seen = new Set();
    for (const r of sorted) {
      if (!seen.has(r.roll_number)) {
        unique.push(r);
        seen.add(r.roll_number);
      }
    }

    res.json(unique);
  } catch (err) {
    next(err);
  }
});

// 2️⃣ Month-wise
/**
 * @swagger
 * /api/admin/attendance/month:
 *   get:
 *     summary: Get month-wise attendance
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         required: true
 *         description: Month (YYYY-MM)
 *       - in: query
 *         name: entry
 *         schema:
 *           type: string
 *         required: true
 *         description: Entry type (FN/AN)
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         required: false
 *         description: Branch
 *       - in: query
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: false
 *         description: Roll number
 *     responses:
 *       200:
 *         description: Month-wise attendance
 */
router.get('/attendance/month', async (req, res, next) => {
  const { month, entry, branch, rollNumber } = req.query;
  const period = entry === 'AN' ? 5 : 1;

  try {
    const sql = `
      SELECT
        a.rollNumber      AS roll_number,
        s.name            AS student_name,
        a.branch,
        a.section,
        s.batchYear AS batchYear,

        a.attendance_date,
        a.record
      FROM attendance a
      JOIN students s ON a.rollNumber = s.rollNumber
      WHERE DATE_FORMAT(a.attendance_date, '%Y-%m') = :month
        AND a.period = :period
        ${branch ? 'AND a.branch     = :branch' : ''}
        ${rollNumber ? 'AND a.rollNumber = :rollNumber' : ''}
    `;

    const rows = await sequelize.query(sql, {
      replacements: { month, period, branch, rollNumber },
      type: QueryTypes.SELECT
    });

    const sorted = rows.sort(compositeSort('attendance_date'));
    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

// 3️⃣ Duration-wise
/**
 * @swagger
 * /api/admin/attendance/duration:
 *   get:
 *     summary: Get duration-wise attendance
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         required: false
 *         description: Branch
 *       - in: query
 *         name: rollNumber
 *         schema:
 *           type: string
 *         required: false
 *         description: Roll number
 *     responses:
 *       200:
 *         description: Duration-wise attendance
 */
router.get('/attendance/duration', async (req, res, next) => {
  const { from, to, branch, rollNumber } = req.query;

  try {
    const sql = `
      SELECT
        a.rollNumber      AS roll_number,
        s.name            AS student_name,
        a.branch,
        a.section,
       s.batchYear AS batchYear,

        a.attendance_date,
        a.record
      FROM attendance a
      JOIN students s ON a.rollNumber = s.rollNumber
      WHERE a.attendance_date BETWEEN :from AND :to
        ${branch ? 'AND a.branch     = :branch' : ''}
        ${rollNumber ? 'AND a.rollNumber = :rollNumber' : ''}
    `;

    const rows = await sequelize.query(sql, {
      replacements: { from, to, branch, rollNumber },
      type: QueryTypes.SELECT
    });

    const sorted = rows.sort(compositeSort('attendance_date'));
    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

router.get('/attendance/subject', async (req, res, next) => {
  const { branch, subject, section, rollNumber, date } = req.query;

  try {
    const sql = `
      SELECT
        a.rollNumber      AS roll_number,
        s.name            AS student_name,
        a.branch,
        a.section,
        s.batchYear AS batchYear,

        a.record
      FROM attendance a
      JOIN students s ON a.rollNumber = s.rollNumber
      WHERE 1=1
        ${branch ? 'AND a.branch       = :branch' : ''}
        ${subject ? 'AND a.subject_code = :subject' : ''}
        ${section ? 'AND a.section      = :section' : ''}
        ${date ? 'AND a.attendance_date = :date' : ''}
        ${rollNumber ? 'AND a.rollNumber   = :rollNumber' : ''}
    `;

    const rows = await sequelize.query(sql, {
      replacements: { branch, subject, section, date, rollNumber },
      type: QueryTypes.SELECT
    });

    const sorted = rows.sort(compositeSort());
    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

// 5️⃣ Below-75% Threshold
router.get('/attendance/threshold', async (req, res, next) => {
  const { branch, rollNumber } = req.query;

  try {
    const sql = `
      SELECT
        roll_number,
        student_name,
        branch,
        section,
        percentage
      FROM attendance_percentage
      WHERE percentage < 75
        AND subject_code = 'ALL'
        ${branch ? 'AND branch     = :branch' : ''}
        ${rollNumber ? 'AND roll_number = :rollNumber' : ''}
    `;

    const rows = await sequelize.query(sql, {
      replacements: { branch, rollNumber },
      type: QueryTypes.SELECT
    });

    const sorted = rows.sort((a, b) => {
      if (a.branch !== b.branch) return String(a.branch).localeCompare(b.branch);
      if (a.section !== b.section) return String(a.section).localeCompare(b.section);
      return customRollSort(a, b);
    });

    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
