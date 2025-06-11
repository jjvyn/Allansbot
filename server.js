const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/api/message', async (req, res) => {
  try {
    const message = req.body.message || '';
    const image = req.files?.image;

    // Simulate logic: echo message and image
    const response = {
      reply: `Received: ${message}`,
      imageUrl: image ? `/uploads/${image.name}` : null,
    };

    if (image) {
      const uploadPath = path.join(__dirname, 'public', 'uploads', image.name);
      await image.mv(uploadPath);
    }

    return res.json(response);
  } catch (err) {
    console.error('POST /api/message error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
