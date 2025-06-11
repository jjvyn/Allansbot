const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Required by Render — do NOT hardcode port
const PORT = process.env.PORT || 10000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// === ROUTES ===

// GET homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /api/message
app.post('/api/message', (req, res) => {
  const { message } = req.body;
  console.log('Message received:', message);

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  res.json({ response: `You said: ${message}` });
});

// POST /api/chat
app.post('/api/chat', (req, res) => {
  const { input } = req.body;
  console.log('Chat received:', input);

  if (!input) {
    return res.status(400).json({ error: 'No input provided' });
  }

  res.json({ reply: `Bot reply to: ${input}` });
});

// POST /api/upload (for images)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  console.log('Image uploaded:', imageUrl);
  res.json({ imageUrl });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
