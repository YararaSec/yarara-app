const express = require("express");
const { createProjectHandler, getProjectsByUserIdHandler } = require("../controllers/projectController");

const router = express.Router();

// Create a new project
router.post("/projects", createProjectHandler);

// Get projects by userId
router.get("/projects/:userId", getProjectsByUserIdHandler);

module.exports = router;