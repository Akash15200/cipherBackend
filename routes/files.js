const express = require('express');
const File = require('../models/File');
const auth = require('../middleware/auth');
const router = express.Router();

// Create file or folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, path, type, content, projectId, parentId } = req.body;

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
    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update file content
router.put('/:id', auth, async (req, res) => {
  try {
    const { content, name } = req.body;

    const file = await File.findOneAndUpdate(
      { _id: req.params.id },
      { 
        ...(content !== undefined && { content }),
        ...(name && { name }),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file/folder
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // If it's a folder, also delete all children
    if (file.type === 'folder') {
      await File.deleteMany({ parentId: req.params.id });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const files = await File.find({ projectId: req.params.projectId });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;