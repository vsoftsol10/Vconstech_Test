import express from 'express';
import { generateUsageReportPDF } from '../controllers/reportController.js';

const router = express.Router();

// POST /api/reports/usage-pdf
router.post('/usage-pdf', generateUsageReportPDF);

export default router;