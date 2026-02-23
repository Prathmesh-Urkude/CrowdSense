import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

import connectMongoDB from './src/configs/mongodb.js';
import { initTables } from './src/models/pg_table.js';
import seedAdmin from './src/controllers/createUserAdmin.js';

import { authenticateJWT, authorizeRoles } from './src/middlewares/auth.js';

import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import reportsRoutes from './src/routes/reports.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB and seed admin user
connectMongoDB(process.env.MONGODB_URL).then(seedAdmin());
// Initialize PostgreSQL tables
initTables();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.resolve("uploads")));


// Routes
app.use('/auth', authRoutes);

app.use(authenticateJWT);

app.get('/', (req, res) => {
  res.json({ 
    message: "Welcome to the CrowdSense API"
  });
});

app.use("/admin", authorizeRoles('admin'), adminRoutes); // Protected admin route
app.use('/reports', reportsRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});