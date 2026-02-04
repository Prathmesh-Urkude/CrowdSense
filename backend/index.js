import express from 'express';
import dotenv from 'dotenv';

import connectMongoDB from './src/configs/mongodb.js';

import { authenticateJWT, authorizeRoles } from './src/middlewares/auth.js';

import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectMongoDB(process.env.MONGODB_URL);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Routes
app.get('/', (req, res) => {
  res.json({ 
    message: "Welcome to the CrowdSense API"
  });
});

// Apply authentication middleware globally
app.use(authenticateJWT);

// Routes
app.use('/auth', authRoutes);
app.get("/admin", authorizeRoles('admin'), adminRoutes); // Protected admin route

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});