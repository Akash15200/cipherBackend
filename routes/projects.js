const express = require('express');
const Project = require('../models/Project');
const File = require('../models/File');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .populate('files')
      .sort({ updatedAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).populate('files');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, files } = req.body;

    const project = new Project({
      name,
      description,
      userId: req.userId
    });

    await project.save();

    // Create default files if provided
    if (files && files.length > 0) {
      const filePromises = files.map(fileData => {
        const file = new File({
          ...fileData,
          projectId: project._id
        });
        return file.save();
      });

      const savedFiles = await Promise.all(filePromises);
      project.files = savedFiles.map(f => f._id);
      await project.save();
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Also delete all associated files
    await File.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;