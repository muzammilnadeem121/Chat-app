const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const activeUsers = new Set();

wss.on('connection', (ws) => {
    let currentUser;

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'username') {
            if (activeUsers.has(parsedMessage.username)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Username is already taken.' }));
            } else {
                currentUser = parsedMessage.username;
                activeUsers.add(currentUser);
            }
        } else if (parsedMessage.type === 'message') {
            if (currentUser) {
                const fullMessage = `${currentUser}: ${parsedMessage.message}`;
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'message', message: fullMessage }));
                    }
                });
            }
        }
    });

    ws.on('close', () => {
        if (currentUser) {
            activeUsers.delete(currentUser);
        }
    });

});

console.log('WebSocket server is running on ws://localhost:8080');
