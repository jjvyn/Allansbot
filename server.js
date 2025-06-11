const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // allow requests from all origins
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/api/message', async (req, res) => {
  try {
    const { name, email, phone, message, imageUrls } = req.body;

    console.log('Request received:', { name, email, phone, message, imageUrls });

    const [summary, emailResult, sheetResult] = await Promise.all([
      require('./openai').generateReply(message),
      require('./services/email').sendEmailWithImage(name, email, phone, message, imageUrls),
      require('./sheets').appendToSheet(name, email, phone, message, imageUrls),
    ]);

    res.status(200).json({ summary });
  } catch (error) {
    console.error('POST /api/message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
