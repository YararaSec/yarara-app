const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  repoId: { type: String, required: true }, // GitHub repo ID
  userId: { type: String, required: true }, // GitHub user ID
  scans: [{ type: mongoose.Schema.Types.ObjectId, ref: "Scan" }], // Array of Scan IDs
});

module.exports = mongoose.model("Project", ProjectSchema);