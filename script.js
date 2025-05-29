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

// ✅ Updated manual end button logic using a message trigger
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

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add(sender === 'You' ? 'user' : 'bot');

  if (sender === 'Allan') {
    msg.innerHTML = `<br><strong>${sender}:</strong> ${text}`;
  } else {
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  }

  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}
