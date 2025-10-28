const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: 'My React Project',
    maxlength: 500
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  framework: {
    type: String,
    enum: ['react', 'vanilla'],
    default: 'react'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  lastAccessed: {
    type: Date,
    default: Date.now
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

// Index for better performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ lastAccessed: -1 });

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get user's projects
projectSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .populate('files')
    .sort({ lastAccessed: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Project', projectSchema);
