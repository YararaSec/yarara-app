const express = require("express");
const { createScanHandler,getScanById } = require("../controllers/scanController");

const router = express.Router();

// Create a new scan
router.post("/scans", createScanHandler);
router.get("/scans/:scanId", getScanById);

module.exports = router;