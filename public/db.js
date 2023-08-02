// db.js

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '127',
  user: 'vishal',
  database: 'chatroom',
  password: 'your_password_here',
});

module.exports = connection;
