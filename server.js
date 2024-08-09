const WebSocket = require('ws');
const mysql = require('mysql');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
const activeUsers = new Set();

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat-app'
});

// Connect to the database
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the MySQL database');
});

wss.on('connection', (ws) => {
    let currentUser;

    // Handle incoming messages
    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'username') {
            if (activeUsers.has(parsedMessage.username)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Username is already taken.' }));
            } else {
                currentUser = parsedMessage.username;
                activeUsers.add(currentUser);
                ws.send(JSON.stringify({ type: 'success', message: `Welcome, ${currentUser}!` }));

                // Send historical messages to the new user
                db.query('SELECT username, message, timestamp FROM messages ORDER BY timestamp DESC LIMIT 50', (err, results) => {
                    if (err) throw err;
                    results.reverse().forEach((row) => {
                        const fullMessage = `${row.username}: ${row.message}`;
                        ws.send(JSON.stringify({ type: 'message', message: fullMessage }));
                    });
                });
            }
        } else if (parsedMessage.type === 'message') {
            if (currentUser) {
                const fullMessage = `${currentUser}: ${parsedMessage.message}`;

                // Save message to database
                db.query('INSERT INTO messages (username, message) VALUES (?, ?)', [currentUser, parsedMessage.message], (err) => {
                    if (err) throw err;
                    console.log('Message saved to database');
                });

                // Broadcast message to all connected clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'message', message: fullMessage }));
                    }
                });
            }
        }
    });

    // Handle client disconnects
    ws.on('close', () => {
        if (currentUser) {
            activeUsers.delete(currentUser);
            console.log(`${currentUser} has disconnected`);
        }
    });

});

console.log('WebSocket server is running on ws://localhost:8080');
