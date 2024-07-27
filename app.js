document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://localhost:8080');
    const usernameInput = document.getElementById('username-input');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messageForm = document.getElementById('chat-container')

    let username;

    // Request notification permission
    Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
            console.log('Notification permission denied');
        }
    });

    function loadMessages() {
        fetch('http://localhost/Chat-app/get_messages.php')
            .then(response =>{
                 if (!response.ok) {
                    throw new Error('get_messages error :'+Error);
                 }
                 response.json()})
            .then(messages => {
                messagesContainer.innerHTML = '';
                messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.textContent = `${message.username}: ${message.Message}`;
                    messagesContainer.appendChild(messageElement);
                });
            })
            .catch(error => console.error('Error loading messages:', error));
    }

    function sendMessage(message) {
        if (!username) {
            alert('Please enter a username');
            return;
        }
        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }
        ws.send(JSON.stringify({ type: 'message', message: message }));
        messageInput.value = '';
    }

    sendButton.addEventListener('click', () => {
        if (!username) {
            username = usernameInput.value.trim();
            if (!username) {
                alert('Please enter a username');
                return;
            }
            ws.send(JSON.stringify({ type: 'username', username: username }));
        } else {
            sendMessage(messageInput.value.trim());
        }
    });

    messageInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    ws.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
    });

    ws.addEventListener('message', event => {
        try {
            const parsedMessage = JSON.parse(event.data);
            switch (parsedMessage.type) {
                case 'error':
                    alert(parsedMessage.message);
                    username = null;
                    break;
                case 'success':
                    username = usernameInput.value;
                    alert(parsedMessage.message);
                    break;
                case 'message':
                    const messageDiv = document.createElement('div');
                    const [sender, ...messageParts] = parsedMessage.message.split(': ');
                    const messageText = messageParts.join(': ');

                    if (username === username) {
                        messageDiv.classList.add('my-message');
                    } else {
                        messageDiv.classList.add('other-message');
                        // Show notification for messages from other users
                        new Notification(sender, { body: messageText });
                    }

                    messageDiv.textContent = parsedMessage.message;
                    messagesContainer.appendChild(messageDiv);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    break;
                case 'info':
                    console.log(parsedMessage.message);
                    break;
                default:
                    console.log('Unknown message type:', parsedMessage.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.addEventListener('error', error => {
        console.error('WebSocket error:', error);
    });
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const message = messageInput.value;
        messageInput.value = '';

        fetch('http://localhost/Chat-app/save_message.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(username)}&message=${encodeURIComponent(message)}`
        }).then(loadMessages);
    });

    loadMessages();
    setInterval(loadMessages, 5000);
});