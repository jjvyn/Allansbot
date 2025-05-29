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

// Serve static files (e.g., index.html) from root directory
app.use(express.static(path.join(__dirname, '/')));

// Serve index.html on root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ TEST ROUTE FOR EMAIL FUNCTION
app.get('/test-email', async (req, res) => {
  try {
    await sendLeadEmail({
      name: "Test User",
      email: "test@example.com",
      phone: "123456789",
      address: "123 Demo Street, Cairns QLD",
      accessInfo: "No locked gates",
      summary: "This is a test email sent from the /test-email route."
    });
    console.log("✅ Test email sent successfully.");
    res.send("✅ Test email sent successfully.");
  } catch (err) {
    console.error("❌ Failed to send test email:", err);
    res.status(500).send("❌ Failed to send test email.");
  }
});

const sessionHistory = {};
const sessionTimeouts = {};

app.post('/api/chat', async (req, res) => {
  const { message, clientId } = req.body;

  try {
    const reply = await getBotReply(message, clientId);

    // Store conversation history
    if (!sessionHistory[clientId]) sessionHistory[clientId] = [];
    sessionHistory[clientId].push({ user: message, bot: reply });

    // Handle session end (explicit or timeout)
    const normalised = message.trim().toLowerCase();
    if (normalised === 'no') {
      await handleSessionEnd(clientId);
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
  }, 2 * 60 * 1000); // 2 minutes
};

const handleSessionEnd = async (clientId) => {
  const history = sessionHistory[clientId];
  if (!history || history.length === 0) return;

  const { name, email, phone, address, accessInfo, summary } = await getSummaryAndContact(clientId);

  try {
    await sendLeadEmail({ name, email, phone, address, accessInfo, summary });
    await logToSheet({ clientId, message: '[Session Ended]', reply: summary });
    console.log(`Email and sheet logged for ${clientId}`);
  } catch (err) {
    console.error(`Failed to send final summary for ${clientId}`, err);
  }

  delete sessionHistory[clientId];
  delete sessionTimeouts[clientId];
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
