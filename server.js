require('dotenv').config();
const path = require('path');
const express = require('express');
const app = require('./api/index');

const port = process.env.PORT || 8000;

// Serve static frontend files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));

app.listen(port, () => {
  console.log(`SLM Server running locally on http://localhost:${port}`);
});
