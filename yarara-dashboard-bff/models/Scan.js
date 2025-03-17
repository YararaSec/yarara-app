const mongoose = require("mongoose");

const ScanSchema = new mongoose.Schema({
  output: { type: String, required: false },
  scanDate: { type: Date, default: Date.now }, // Date of the scan
  vulnerabilitiesCount: { type: Number, required: false }, // Number of vulnerabilities
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true }, // Reference to Project
  status: {
    type: String,
    enum: ["Pending", "Error", "Completed"], // Enum validation
    default: "Pending", // Default value
    required: false,
  },
});

module.exports = mongoose.model("Scan", ScanSchema);