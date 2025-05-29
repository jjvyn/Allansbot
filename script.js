const launcher = document.getElementById('chat-launcher');
const widget = document.getElementById('chat-widget');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const body = document.getElementById('chat-body');
const endButton = document.getElementById('end-chat');

launcher.addEventListener('click', () => {
  widget.classList.toggle('hidden');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
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

    const trimmed = trimIfTooLong(data.reply);
    appendMessage('Allan', trimmed || "Sorry, something went wrong.");
  } catch (err) {
    console.error(err);
    appendMessage('Allan', "Error reaching the server.");
  }
});

endButton.addEventListener('click', async () => {
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
  } catch (err) {
    console.error('Error ending chat manually:', err);
    appendMessage('Allan', 'Oops! Something went wrong when finishing the chat.');
  }
});

// ✅ Updated formatter for Allan's responses
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'You' ? 'user' : 'bot');

  if (sender === 'Allan') {
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')         // bold
      .replace(/^- (.*)$/gm, '<li>• $1</li>')                   // bullet list
      .replace(/^\d+\.\s(.*)$/gm, '<li>$1</li>')                // numbered list
      .replace(/\n{2,}/g, '</p><p>')                            // paragraph breaks
      .replace(/\n/g, '<br>')                                   // line breaks
      .replace(/<li>/, '<ul><li>')                              // open list
      .replace(/<\/li>(?!<li>)/g, '</li></ul>');                // close list

    msg.innerHTML = `<br><strong>${sender}:</strong><p>${formattedText}</p>`;
  } else {
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  }

  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

// ✅ Trim long replies unless important
function trimIfTooLong(text) {
  const maxSentences = 3;
  const mustKeep = ['address', 'email', 'technician', 'book', 'sample'];

  if (mustKeep.some(word => text.toLowerCase().includes(word))) return text;

  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, maxSentences).join(' ') + (sentences.length > maxSentences ? ' [...]' : '');
}
