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
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
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
    
    // Update last accessed time
    project.lastAccessed = new Date();
    await project.save();
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, files, framework = 'react' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = new Project({
      name: name.trim(),
      description: description?.trim() || 'My React Project',
      userId: req.userId,
      framework
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
      
      // Populate files for response
      await project.populate('files');
    }

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('files');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
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

    res.json({ 
      message: 'Project deleted successfully',
      deletedProjectId: req.params.id
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project count for user
router.get('/user/stats', auth, async (req, res) => {
  try {
    const projectCount = await Project.countDocuments({ userId: req.userId });
    const recentProjects = await Project.find({ userId: req.userId })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('name lastAccessed');
    
    res.json({
      totalProjects: projectCount,
      recentProjects
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

module.exports = router;