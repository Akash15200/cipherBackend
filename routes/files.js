const express = require('express');
const File = require('../models/File');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const router = express.Router();

// Create file or folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, path, type, content, projectId, parentId } = req.body;

    // Validate required fields
    if (!name || !path || !type || !projectId) {
      return res.status(400).json({ 
        error: 'Name, path, type, and projectId are required' 
      });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ 
      _id: projectId, 
      userId: req.userId 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if file/folder already exists at path
    const existingFile = await File.findOne({ projectId, path });
    if (existingFile) {
      return res.status(400).json({ error: 'File/folder already exists at this path' });
    }

    const file = new File({
      name,
      path,
      type,
      content: content || '',
      projectId,
      parentId: parentId || null,
      isRoot: !parentId
    });

    await file.save();

    // Add file to project's files array
    await Project.findByIdAndUpdate(projectId, {
      $addToSet: { files: file._id }
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ error: 'Failed to create file/folder' });
  }
});

// Update file content
router.put('/:id', auth, async (req, res) => {
  try {
    const { content, name, path } = req.body;

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify file belongs to user's project
    const project = await Project.findOne({ 
      _id: file.projectId, 
      userId: req.userId 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData = { updatedAt: Date.now() };
    
    if (content !== undefined) {
      updateData.content = content;
    }
    
    if (name && name !== file.name) {
      updateData.name = name;
      
      // Update path if name changed
      const oldPath = file.path;
      const newPath = oldPath.replace(/[^\/]+$/, name);
      updateData.path = newPath;
    }
    
    if (path && path !== file.path) {
      // Check if path already exists
      const existingFile = await File.findOne({ 
        projectId: file.projectId, 
        path 
      });
      if (existingFile && existingFile._id.toString() !== req.params.id) {
        return res.status(400).json({ error: 'Path already exists' });
      }
      updateData.path = path;
    }

    const updatedFile = await File.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedFile);
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete file/folder
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify file belongs to user's project
    const project = await Project.findOne({ 
      _id: file.projectId, 
      userId: req.userId 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await File.findByIdAndDelete(req.params.id);

    // If it's a folder, also delete all children
    if (file.type === 'folder') {
      await File.deleteMany({ parentId: req.params.id });
    }

    // Remove file from project's files array
    await Project.findByIdAndUpdate(file.projectId, {
      $pull: { files: req.params.id }
    });

    res.json({ 
      message: 'File deleted successfully',
      deletedFileId: req.params.id
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get files for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    // Verify project belongs to user
    const project = await Project.findOne({ 
      _id: req.params.projectId, 
      userId: req.userId 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await File.find({ projectId: req.params.projectId })
      .sort({ type: -1, name: 1 }); // Folders first, then files
    
    res.json(files);
  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({ error: 'Failed to fetch project files' });
  }
});

// Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify file belongs to user's project
    const project = await Project.findOne({ 
      _id: file.projectId, 
      userId: req.userId 
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(file);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

module.exports = router;