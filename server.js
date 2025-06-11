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

// Confirm required environment variables
console.log('🔑 OPENAI_API_KEY loaded?', !!process.env.OPENAI_API_KEY);
console.log('📄 GOOGLE_KEY_BASE64 loaded?', !!process.env.GOOGLE_KEY_BASE64);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static(uploadsDir));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only image files allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Invalid file type or size.' });
  }
  const imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const sessionHistory = {};
const sessionTimeouts = {};

app.post('/api/chat', async (req, res) => {
  const { message, clientId } = req.body;

  try {
    const reply = await getBotReply(message, clientId);
    if (!sessionHistory[clientId]) sessionHistory[clientId] = [];
    sessionHistory[clientId].push({ user: message, bot: reply });

    const normalised = message.trim().toLowerCase();
    const endPhrases = [
      'no', 'no thanks', 'that’s all', 'thanks that’s all',
      'i’m done', 'nothing else', 'end chat', 'end_chat_now',
      'thanks', 'thank you', 'cheers', 'ta', 'appreciate it'
    ];

    if (endPhrases.includes(normalised)) {
      const confirmation = await handleSessionEnd(clientId);
      return res.json({ reply: confirmation });
    } else {
      resetSessionTimeout(clientId);
    }

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: 'Oops! Something went wrong.' });
  }
});

const resetSessionTimeout = (clientId) => {
  if (sessionTimeouts[clientId]) clearTimeout(sessionTimeouts[clientId]);
  sessionTimeouts[clientId] = setTimeout(() => handleSessionEnd(clientId), 2 * 60 * 1000);
};

const handleSessionEnd = async (clientId) => {
  const history = sessionHistory[clientId];
  if (!history || history.length === 0) return;

  const { name, email, phone, address, accessInfo, summary } = await getSummaryAndContact(clientId);

  const imageUrls = history
    .flatMap(entry => {
      const matches = entry.user?.match(/\/uploads\/[^\s"'<>]+/g);
      return matches?.map(relative => `${BASE_URL}${relative}`) || [];
    });

  try {
    await sendLeadEmail({
      name,
      email,
      phone,
      address,
      accessInfo,
      summary,
      imageUrls,
      isCustomerCopy: false
    });

    if (email && email.includes('@')) {
      await sendLeadEmail({
        name,
        email,
        phone,
        address,
        accessInfo,
        summary,
        imageUrls,
        isCustomerCopy: true
      });
    }

    await logToSheet({
      clientId,
      name,
      email,
      phone,
      address,
      accessInfo,
      summary,
      imageUrls
    });

    console.log(`✅ Lead processed for ${clientId}`);
  } catch (err) {
    console.error(`❌ Error finalising session for ${clientId}`, err);
  }

  delete sessionHistory[clientId];
  delete sessionTimeouts[clientId];

  return 'Thanks! I’ve sent your details to our team. They’ll be in touch shortly. Have a great day!';
};

app.listen(PORT, () => console.log(`🚀 Server running on ${BASE_URL}`));
