require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const { getBotReply, getSummaryAndContact } = require('./services/openai');
const { sendLeadEmail } = require('./services/email');
const { logToSheet } = require('./services/sheets');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Confirm environment vars
console.log('🔑 OPENAI_API_KEY loaded?', !!process.env.OPENAI_API_KEY);
console.log('📄 GOOGLE_KEY_BASE64 loaded?', !!process.env.GOOGLE_KEY_BASE64);

// Ensure uploads dir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Serve static files
app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static(uploadsDir));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only image files allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Invalid file type or size.' });
  const imageUrl = `/uploads/${req.file.filename}`;
  console.log(`📷 Uploaded: ${imageUrl}`);
  res.json({ imageUrl });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Session state
const sessionHistory = {};
const sessionTimeouts = {};

app.post('/api/chat', async (req, res) => {
  const { message, clientId } = req.body;

  try {
    const reply = await getBotReply(message, clientId);
    if (!sessionHistory[clientId]) sessionHistory[clientId] = [];
    sessionHistory[clientId].push({ user: message,
