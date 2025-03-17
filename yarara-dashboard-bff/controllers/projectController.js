const { createProject, findProjectsByUserId } = require("../services/projectService");

// Create a new project
const createProjectHandler = async (req, res) => {
  const { name, repoId, userId } = req.body;
  try {
    const project = await createProject(name, repoId, userId);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get projects by userId
const getProjectsByUserIdHandler = async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await findProjectsByUserId(userId);
    res.status(200).json(projects);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { createProjectHandler, getProjectsByUserIdHandler };