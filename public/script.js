const chatbox = document.getElementById('chatbox');
const inputField = document.getElementById('userInput');
const uploadButton = document.getElementById('uploadImage');

const API_BASE = 'https://allansbot.onrender.com/api';

function appendMessage(sender, message) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.innerText = message;
  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

async function sendMessage() {
  const message = inputField.value.trim();
  if (!message) return;

  appendMessage('user', message);
  inputField.value = '';

  try {
    const response = await fetch(`${API_BASE}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) throw new Error('Server responded with an error');

    const data = await response.json();
    appendMessage('bot', data.response || 'No response from server.');
  } catch (err) {
    console.error('Error sending message:', err);
    appendMessage('bot', 'Error reaching the server.');
  }
}

async function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  appendMessage('user', 'Uploading image...');

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    const img = document.createElement('img');
    img.src = data.imageUrl;
    img.alt = 'Uploaded';
    img.style.maxWidth = '100%';
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'user');
    msgDiv.appendChild(img);
    chatbox.appendChild(msgDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
  } catch (err) {
    console.error('Upload error:', err);
    appendMessage('bot', 'There was an error uploading your image.');
  }
}

// Event listeners
inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
uploadButton.addEventListener('change', uploadImage);
