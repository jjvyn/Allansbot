const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// === ROUTES ===

// GET homepage (optional, handled by static)
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

  // TODO: Replace with actual response logic
  res.json({ response: `You said: ${message}` });
});

// POST /api/chat
app.post('/api/chat', (req, res) => {
  const { input } = req.body;
  console.log('Chat received:', input);

  if (!input) {
    return res.status(400).json({ error: 'No input provided' });
  }

  // TODO: Replace with actual chat logic
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
