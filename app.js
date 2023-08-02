var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);

var io = require('socket.io')(server);
var path = require('path');
var mysql = require('mysql2');

const dbConfig = {
  host: 'localhost', // Replace with your MySQL server host
  user: 'vishal', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'chatroom_db', // Replace with your database name
};

app.use(express.static(path.join(__dirname, './public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

var name;

io.on('connection', (socket) => {
  console.log('new user connected');
  let name;

  socket.on('joining msg', (username) => {
    name = username;
    io.emit('user activity', `${name} joined the chat`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (name) {
      io.emit('user activity', `${name} left the chat`);
    }
  });

  socket.on('chat message', (msg) => {
    const messageObject = {
      name: name,
      message: msg,
    };
    socket.broadcast.emit('chat message', messageObject);

    // Save the message to the database
    const connection = mysql.createConnection(dbConfig);
    connection.query('INSERT INTO chat_messages (name, message) VALUES (?, ?)', [name, msg], (err, result) => {
      if (err) {
        console.log('Error inserting message into database:', err);
      } else {
        console.log('Message inserted into the database. Insert ID:', result.insertId);
      }
      connection.end();
    });
  });

  // Send chat history to the user when they connect
  socket.on('get chat history', () => {
    getChatHistoryFromDatabase()
      .then((messages) => {
        socket.emit('chat history', messages);
      })
      .catch((error) => {
        console.log('Error fetching chat history from database:', error);
      });
  });
});

function getChatHistoryFromDatabase() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbConfig);
    connection.query('SELECT * FROM chat_messages ORDER BY timestamp ASC', (err, messages) => {
      if (err) {
        console.log('Error fetching chat history from database:', err);
        reject(err);
      } else {
        resolve(messages);
      }
      connection.end();
    });
  });
}

server.listen(3000, () => {
  console.log('Server listening on :3000');
});
