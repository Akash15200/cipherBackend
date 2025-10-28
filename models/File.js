const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['file', 'folder'],
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'javascript'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

fileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-detect language based on file extension
  if (this.type === 'file') {
    if (this.name.endsWith('.js') || this.name.endsWith('.jsx')) {
      this.language = 'javascript';
    } else if (this.name.endsWith('.css')) {
      this.language = 'css';
    } else if (this.name.endsWith('.html')) {
      this.language = 'html';
    } else if (this.name.endsWith('.json')) {
      this.language = 'json';
    }
  }
  
  next();
});

// Index for better query performance
fileSchema.index({ projectId: 1, path: 1 });
fileSchema.index({ projectId: 1, parentId: 1 });

module.exports = mongoose.model('File', fileSchema);
