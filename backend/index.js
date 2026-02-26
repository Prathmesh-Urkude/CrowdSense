import express from 'express';
import path from 'path';

import connectMongoDB from './src/configs/mongodb.js';
import { initPGTables } from './src/models/pg_table.js';
import seedAdmin from './src/controllers/createUserAdmin.js';

import { authenticateJWT, authorizeRoles } from './src/middlewares/auth.js';

import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import reportsRoutes from './src/routes/reports.js';
import upvoteRoutes from './src/routes/upvote.js';

import { PORT } from './src/configs/env.js';

const app = express();

connectMongoDB().then(seedAdmin()); // Connect to MongoDB and seed admin user
initPGTables(); // Initialize PostgreSQL tables

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.resolve("uploads")));

// temporary route for AI service testing
import aiRoute from './src/routes/ai_service.js';
app.use("/ai", aiRoute);

// Routes
app.use('/auth', authRoutes);

app.use(authenticateJWT); // Protect all routes below with JWT authentication

app.get('/', (req, res) => {
  res.json({ 
    message: "Welcome to the CrowdSense API"
  });
});

app.use("/admin", authorizeRoles('admin'), adminRoutes); // Protected admin route
app.use('/reports', reportsRoutes);
app.use('/upvote', upvoteRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});