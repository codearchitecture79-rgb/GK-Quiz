const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Express application init
const app = express();
const PORT = process.env.PORT || 5000;
const DATA_PATH = path.join(__dirname, 'data.json');

// Global Middlewares
app.use(cors({
    // origin: '*', // In production, replace with your frontend URL (e.g., 'https://yourquizsite.com')
    origin: 'https://gkmaster-ind.netlify.app', // For local development, allow frontend
    // origin: 'http://127.0.0.1:3000', // For local development, allow frontend
    methods: ['GET'],
    credentials: true
}));
app.use(express.json());

// Basic Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Helper function to handle reading the JSON database safely
const readQuizDatabase = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(DATA_PATH, 'utf8', (err, data) => {
            if (err) return reject(err);
            try {
                resolve(JSON.parse(data));
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
};

/**
 * @route   GET /api/questions
 * @desc    Fetch quiz questions with optional shuffling
 * @query   ?shuffle=true (Optional: mixes up the 210 questions)
 */
app.get('/api/questions/', async (req, res) => {
    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error('File System Error:', err.message);
            return res.status(500).json({ error: 'Failed to access question data.' });
        }
        
        try {
            const allQuestions = JSON.parse(data);
            // Parse requested packet number, default to Packet 1 if missing or invalid
            let requestedPacket = parseInt(req.query.packet) || 1;
            
            if (requestedPacket < 1 || requestedPacket > 40) {
                requestedPacket = 1;
            }

            // Filter out exactly the 25 questions belonging to this sequential block
            const packetQuestions = allQuestions.filter(q => q.packet === requestedPacket);
            
            res.status(200).json(packetQuestions);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            res.status(500).json({ error: 'Data parsing breakdown.' });
        }
    });
});

// 404 Wildcard Error Handler for broken routes
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'API Endpoint not found.' });
});

// Boot up Node App
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 GK QUIZ BACKEND IS ACTIVE`);
    console.log(`📡 URL Endpoint: http://localhost:${PORT}/api/questions`);
    console.log(`===================================================`);
});

