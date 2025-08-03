// server.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swagger');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting (adjust as needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration with dynamic origin handling
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://college-systemcahcet.vercel.app',
      'https://main.d1dqbntcyikp3v.amplifyapp.com',
      'https://main.d3q4wyx09cwtx7.amplifyapp.com',
      'https://localhost:3000',
      'http://localhost:3000',
      'http://localhost:7000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};


app.use(express.json());
app.use(cors(corsOptions));
app.use(limiter);
app.options('*', cors(corsOptions));

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount routes
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const botRoutes = require('./routes/botRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/ask', botRoutes);
app.use('/api/admin', adminRoutes);
// Simple health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "active", ai: "ready" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Swagger UI available at http://localhost:7000/api-docs
