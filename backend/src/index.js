import express from 'express';
import dotenv from'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the CrowdSense API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});