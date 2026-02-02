import express from 'express';
import dotenv from 'dotenv';

import connectMongoDB from './src/configs/mongodb.js';

import { authenticateJWT } from './src/middlewares/auth.js';

import authRoutes from './src/routes/auth.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectMongoDB(process.env.MONGODB_URL);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Routes
app.get('/', (req, res) => {
  res.send('Welcome to the CrowdSense API');
});

app.get("/protected", authenticateJWT, (req, res) => {
  res.json({
    message: "You are authorized!",
    user: req.user   
  });
});

// Routes
app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});