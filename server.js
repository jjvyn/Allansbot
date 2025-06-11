require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { sendEmails } = require('./email');
const { processMessage } = require('./openai');
const { saveToGoogleSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Serve index.html at root ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// === Image upload handling ===
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const sessions = {};

app.post('/upload', upload.single('image'), (req, res) => {
  const sessionId = req.body.sessionId;
  if (!sessions[sessionId]) sessions[sessionId] = { messages: [] };

  const imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
  sessions[sessionId].imageUrls = sessions[sessionId].imageUrls || [];
  sessions[sessionId].imageUrls.push(imageUrl);

  console.log(`Uploaded: ${imageUrl}`);
  res.json({ success: true, url: imageUrl });
});

app.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessions[sessionId]) sessions[sessionId] = { messages: [] };

  sessions[sessionId].messages.push({ role: 'user', content: message });
  const reply = await processMessage(sessions[sessionId].messages);
  sessions[sessionId].messages.push({ role: 'assistant', content: reply });

  res.json({ reply });
});

app.post('/end-chat', async (req, res) => {
  const { sessionId, contactInfo } = req.body;
  const session = sessions[sessionId];

  if (session) {
    const summary = session.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `${m.role === 'user' ? 'Customer' : 'Allan'}: ${m.content}`)
      .join('\n');

    const emailOptions = {
      contactInfo,
      summary,
      imageUrls: session.imageUrls || [],
    };

    console.log('📧 Preparing emails for', sessionId);
    await sendEmails(emailOptions);
    await saveToGoogleSheet(contactInfo, summary);

    console.log('✅ Session completed for', sessionId);
    delete sessions[sessionId];
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
