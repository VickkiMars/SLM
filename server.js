require('dotenv').config();
const path = require('path');
const express = require('express');
const app = require('./api/index');

const port = process.env.PORT || 8000;

// Serve static frontend compiled assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`SLM Server running locally on http://localhost:${port}`);
});

