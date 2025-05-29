require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { getBotReply, getSummaryAndContact } = require('./services/openai');
const { sendLeadEmail } = require('./services/email');
const { logToSheet } = require('./services/sheets');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const sessionHistory = {};
const sessionTimeouts = {};

app.post('/api/chat', async (req, res) => {
  const { message, clientId } = req.body;

  try {
    const reply = await getBotReply(message, clientId);

    // Store message history
    if (!sessionHistory[clientId]) sessionHistory[clientId] = [];
    sessionHistory[clientId].push({ user: message, bot: reply });

    // Trigger end if message matches end phrase
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
  if (sessionTimeouts[clientId]) {
    clearTimeout(sessionTimeouts[clientId]);
  }

  sessionTimeouts[clientId] = setTimeout(async () => {
    console.log(`Session timeout for client ${clientId}`);
    await handleSessionEnd(clientId);
  }, 2 * 60 * 1000);
};

const handleSessionEnd = async (clientId) => {
  const history = sessionHistory[clientId];
  if (!history || history.length === 0) return;

  const { name, email, phone, address, accessInfo, summary } = await getSummaryAndContact(clientId);

  try {
    await sendLeadEmail({ name, email, phone, address, accessInfo, summary });
    await logToSheet({ clientId, name, email, phone, address, accessInfo, summary });
    console.log(`✅ Session ended for ${clientId}`);
  } catch (err) {
    console.error(`❌ Failed to complete session for ${clientId}`, err);
  }

  delete sessionHistory[clientId];
  delete sessionTimeouts[clientId];

  return 'Thanks! I’ve sent your details to our team. They’ll be in touch shortly. Have a great day!';
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
