const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/files', require('./routes/files'));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'CipherStudio Backend API',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully to Atlas'))
.catch(err => {
  console.log('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🗄️  MongoDB connected to database:', mongoose.connection.db.databaseName);
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 MongoDB URI: ${process.env.MONGODB_URI?.split('@')[1]?.split('/')[0]}`);
});