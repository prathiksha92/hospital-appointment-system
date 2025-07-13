const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session'); // ✅ Add this
require('dotenv').config(); // Load .env file

// Import DB connection
const db = require('./db/connection');

// Import routes
const patientRoutes = require('./routes/patientRoutes');

// 🔐 Setup session middleware
app.use(session({
  secret: 'hospitalSecretKey123',  // You can change this to anything secret
  resave: false,
  saveUninitialized: false
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/', patientRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
