const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { handleChat } = require('./openai');
const { sendEmail } = require('./email');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.send('Bot is running.');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, clientId } = req.body;
    const reply = await handleChat(message, clientId);
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ reply: "Sorry, something went wrong." });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    await sendEmail({ imageUrl });
    res.json({ imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Image upload failed.' });
  }
});

// Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
