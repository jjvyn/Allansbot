const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { processMessage } = require('./openai');
const { sendCustomerEmail, sendServiceEmail } = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔧 Add API route
app.post('/api/message', async (req, res) => {
  try {
    const { message, name, email, phone, imageUrls, address, accessInfo } = req.body;

    const botResponse = await processMessage(message);

    // Send email to service team
    await sendServiceEmail({ message, name, email, phone, imageUrls, address, accessInfo });

    // Send confirmation to customer
    if (email) {
      await sendCustomerEmail({ message, name, email, phone, imageUrls });
    }

    res.status(200).json({ reply: botResponse });
  } catch (err) {
    console.error('Error in /api/message:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fallback: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
