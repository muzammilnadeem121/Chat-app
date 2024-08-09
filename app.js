document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://localhost:8080'); // Connect to the local WebSocket server
    const usernameInput = document.getElementById('username-input');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let username;
    fetch('get_messages.php')
        .then(response => response.json())
        .then(messages => {
            messages.reverse().forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.textContent = `${message.username}: ${message.message}`;
                messagesContainer.appendChild(messageDiv);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        })
        .catch(error => console.error('Error fetching messages:', error));

    // Request notification permission
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Function to show notifications
    function showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body });
        }
    }

    ws.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
    });

    ws.addEventListener('message', (event) => {
        const parsedMessage = JSON.parse(event.data);

        if (parsedMessage.type === 'error') {
            alert(parsedMessage.message);
            username = null;  // Reset the username if there's an error
        } else if (parsedMessage.type === 'success') {
            username = usernameInput.value;
            alert(parsedMessage.message);
        } else if (parsedMessage.type === 'message') {
            const messageDiv = document.createElement('div');
            const [sender, ...messageParts] = parsedMessage.message.split(': ');
            const messageText = messageParts.join(': ');

            if (sender === username) {
                messageDiv.classList.add('my-message');
            } else {
                messageDiv.classList.add('other-message');
                // Show notification for messages from other users
                showNotification(sender, messageText);
            }

            messageDiv.textContent = parsedMessage.message;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
        } else if (parsedMessage.type === 'info') {
            console.log(parsedMessage.message);
        }
    });

    sendButton.addEventListener('click', () => {
        if (!username) {
            username = usernameInput.value.trim();
            if (!username) {
                alert('Please enter a username.');
                return;
            }
            ws.send(JSON.stringify({ type: 'username', username: username }));
        } else {
            const message = messageInput.value.trim();
            if (message) {
                ws.send(JSON.stringify({ type: 'message', message: message }));
                messageInput.value = '';
            } else {
                alert('Please enter a message.');
            }
        }
    });

    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });
});
