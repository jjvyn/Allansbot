const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API route for message
app.post('/api/message', async (req, res) => {
  try {
    const message = req.body.message || '';
    let imageUrl = null;

    if (req.files && req.files.image) {
      const image = req.files.image;
      const imagePath = path.join(uploadsDir, image.name);
      await image.mv(imagePath);
      imageUrl = `/uploads/${image.name}`;
    }

    return res.status(200).json({
      reply: `Received: ${message}`,
      imageUrl,
    });
  } catch (err) {
    console.error('POST /api/message error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Catch-all: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
