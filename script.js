const launcher = document.getElementById('chat-launcher');
const widget = document.getElementById('chat-widget');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const body = document.getElementById('chat-body');
const endButton = document.getElementById('end-chat');

let chatEnded = false;

launcher.addEventListener('click', () => {
  widget.classList.toggle('hidden');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (chatEnded) return;

  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage("user", userMessage);
  input.value = '';

  const typingEl = addTypingIndicator();

  try {
    const res = await fetch('https://allansbot.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        clientId: 'cairns-poolpros'
      })
    });

    const data = await res.json();
    typingEl.remove();

    const trimmed = trimIfTooLong(data.reply);
    addMessage("bot", trimmed || "Sorry, something went wrong.");

    if (trimmed?.toLowerCase().includes("our team will be in touch") || trimmed?.toLowerCase().includes("chat has ended")) {
      disableChat();
    }
  } catch (err) {
    typingEl.remove();
    console.error(err);
    addMessage("bot", "Error reaching the server.");
  }
});

endButton.addEventListener('click', async () => {
  if (chatEnded) return;

  const typingEl = addTypingIndicator();

  try {
    const res = await fetch('https://allansbot.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'end_chat_now',
        clientId: 'cairns-poolpros'
      })
    });

    const data = await res.json();
    typingEl.remove();
    addMessage('bot', data.reply || 'Your details have been passed to our team. Thanks!');
    disableChat();
  } catch (err) {
    typingEl.remove();
    console.error('Error ending chat manually:', err);
    addMessage('bot', 'Oops! Something went wrong when finishing the chat.');
  }
});

// ✅ Render message with bubble + name
function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;

  const name = document.createElement('div');
  name.className = 'name-label';
  name.textContent = sender === 'user' ? 'You' : 'Allan';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (sender === 'bot') {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)$/gm, '<li>• $1</li>')
      .replace(/^\d+\.\s(.*)$/gm, '<li>$1</li>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/<li>/, '<ul><li>')
      .replace(/<\/li>(?!<li>)/g, '</li></ul>');

    bubble.innerHTML = `<p>${formatted}</p>`;
  } else {
    bubble.textContent = text;
  }

  msg.appendChild(name);
  msg.appendChild(bubble);
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

// ✅ Typing animation bubble
function addTypingIndicator() {
  const msg = document.createElement('div');
  msg.className = 'message bot';

  const name = document.createElement('div');
  name.className = 'name-label';
  name.textContent = 'Allan';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  msg.appendChild(name);
  msg.appendChild(bubble);
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;

  return msg;
}

// ✅ Trim long replies unless they contain important words
function trimIfTooLong(text) {
  const maxSentences = 3;
  const mustKeep = ['address', 'email', 'technician', 'book', 'sample'];

  if (mustKeep.some(word => text.toLowerCase().includes(word))) return text;

  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, maxSentences).join(' ') + (sentences.length > maxSentences ? ' [...]' : '');
}

// ✅ Disable input after ending chat
function disableChat() {
  chatEnded = true;
  input.disabled = true;
  endButton.disabled = true;
  addMessage('bot', 'Chat has ended. Our team will be in touch shortly.');
}
