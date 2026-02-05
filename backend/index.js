import express from 'express';
import dotenv from 'dotenv';

import connectMongoDB from './src/configs/mongodb.js';
import { initTables } from './src/models/pg_table.js';
import seedAdmin from './src/controllers/createUserAdmin.js';

import { authenticateJWT, authorizeRoles } from './src/middlewares/auth.js';

import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectMongoDB(process.env.MONGODB_URL).then(seedAdmin());
initTables();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply authentication middleware globally
app.use(authenticateJWT);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: "Welcome to the CrowdSense API"
  });
});

app.use('/auth', authRoutes);
app.get("/admin", authorizeRoles('admin'), adminRoutes); // Protected admin route

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});