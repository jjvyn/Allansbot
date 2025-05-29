const launcher = document.getElementById('chat-launcher');
const widget = document.getElementById('chat-widget');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const body = document.getElementById('chat-body');

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
    appendMessage('Allan', formatBotText(data.reply || "Sorry, something went wrong."));
  } catch (err) {
    console.error(err);
    document.querySelectorAll('#chat-body .bot:last-child').forEach(el => el.remove());
    appendMessage('Allan', "Oops! Something went wrong. Please try again.");
  }
});

function appendMessage(sender, htmlContent) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'You' ? 'user' : 'bot');

  msg.innerHTML = sender === 'Allan'
    ? `<br><strong>${sender}:</strong>${htmlContent}`
    : `<strong>${sender}:</strong> ${htmlContent}`;

  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

function formatBotText(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let formatted = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (/^(-|\*|\d+\.)\s+/.test(trimmed)) {
      // Start or continue a list
      if (!inList) {
        formatted += '<ul>';
        inList = true;
      }
      formatted += `<li>${trimmed.replace(/^(-|\*|\d+\.)\s+/, '')}</li>`;
    } else {
      // If previously in a list, close it
      if (inList) {
        formatted += '</ul>';
        inList = false;
      }
      formatted += `<p>${trimmed}</p>`;
    }
  });

  if (inList) formatted += '</ul>';
  return formatted;
}
