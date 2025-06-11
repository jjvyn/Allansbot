const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const { handleChat } = require('./services/openai.js');
const { logToSheet } = require('./services/sheets.js');
const { sendEmails } = require('./services/email.js');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, clientId } = req.body;
  try {
    const reply = await handleChat(message, clientId);
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ reply: 'Error generating response' });
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');
  const imageUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${file.filename}`;
  res.json({ imageUrl });
});

// End session endpoint
app.post('/api/end-session', async (req, res) => {
  const { clientId, customer, summary, images = [] } = req.body;
  try {
    console.log('📤 Preparing emails for', clientId);
    await logToSheet(customer, summary);
    await sendEmails(customer, summary, images);
    console.log('✅ Session completed for', clientId);
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ End session error:', err);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
