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

  appendMessage('You', userMessage);
  input.value = '';

  appendMessage('Allan', 'Thinking...');

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
    document.querySelectorAll('#chat-body .bot:last-child').forEach(el => el.remove());

    appendMessage('Allan', data.reply || "Sorry, something went wrong.");

    if (data.reply?.toLowerCase().includes("have a great day")) {
      markChatEnded();
    }
  } catch (err) {
    console.error(err);
    appendMessage('Allan', "Error reaching the server.");
  }
});

endButton.addEventListener('click', async () => {
  if (chatEnded) return;

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
    appendMessage('Allan', data.reply || 'Your details have been passed to our team. Thanks!');
    markChatEnded();
  } catch (err) {
    console.error('Error ending chat manually:', err);
    appendMessage('Allan', 'Oops! Something went wrong when finishing the chat.');
  }
});

function markChatEnded() {
  chatEnded = true;
  input.disabled = true;
  input.placeholder = "Chat has ended.";
  form.querySelector('button').disabled = true;
}

// ✅ Message formatter
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'You' ? 'user' : 'bot');

  if (sender === 'Allan') {
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)$/gm, '<li>• $1</li>')
      .replace(/^\d+\.\s(.*)$/gm, '<li>$1</li>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/<li>/, '<ul><li>')
      .replace(/<\/li>(?!<li>)/g, '</li></ul>');

    msg.innerHTML = `<br><strong>${sender}:</strong><p>${formattedText}</p>`;
  } else {
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  }

  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

function trimIfTooLong(text) {
  const maxSentences = 3;
  const mustKeep = ['address', 'email', 'technician', 'book', 'sample'];
  if (mustKeep.some(word => text.toLowerCase().includes(word))) return text;

  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, maxSentences).join(' ') + (sentences.length > maxSentences ? ' [...]' : '');
}
