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
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        clientId: 'cairns-poolpros' // change this for each client
      })
    });

    const data = await res.json();
    document.querySelectorAll('#chat-body .bot:last-child').forEach(el => el.remove());
    appendMessage('Allan', data.reply || "Sorry, something went wrong.");
  } catch (err) {
    console.error(err);
    appendMessage('Allan', "Error reaching the server.");
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'You' ? 'user' : 'bot');

  // Add line break above Allan’s messages, and bold sender names
  if (sender === 'Allan') {
    msg.innerHTML = `<br><strong>${sender}:</strong> ${text}`;
  } else {
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  }

  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}
