const Project = require("../models/Project");

// Create a new project
const createProject = async (name, repoId, userId) => {
  const project = new Project({ name, repoId, userId });
  return await project.save();
};

// Find projects by userId
const findProjectsByUserId = async (userId) => {
  return await Project.find({ userId }).populate("scans");
};

module.exports = { createProject, findProjectsByUserId };