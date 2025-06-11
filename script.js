const chatContainer = document.getElementById('chat-container');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const uploadInput = document.getElementById('upload-input');

// Use absolute API path with correct endpoint
const BASE_URL = 'https://allansbot.onrender.com';

function appendMessage(sender, text) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.innerText = text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  messageInput.value = '';

  try {
    const response = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    appendMessage('bot', data.reply || 'Sorry, I didn’t understand that.');
  } catch (error) {
    console.error('Error:', error);
    appendMessage('bot', 'Error reaching the server.');
  }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

uploadInput.addEventListener('change', () => {
  appendMessage('user', '[Image uploaded]');
});
