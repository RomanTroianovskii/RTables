const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 9000;
const addr = '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET || 'rtables-dev-secret';
const DB_PATH = path.join(__dirname, 'Data.db');

let db;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

function logError(prefix, error) {
  console.error(prefix, {
    message: error?.message,
    stack: error?.stack,
    code: error?.code
  });
}

async function initDatabase() {
  try {
    console.log(`Using database: ${DB_PATH}`);
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS TABLES (
        ID INTEGER PRIMARY KEY,
        NAME TEXT NOT NULL,
        CONTENT TEXT NOT NULL
      );
    `);

    console.log('Database initialized');
    app.listen(port, addr, () => {
      console.log(`Server started on http://${addr}:${port}`);
    });
  } catch (error) {
    logError('Database init error', error);
  }
}

app.post('/deluser', async (req, res) => {
  try {
    const { username } = req.body;
    await db.run('DELETE FROM users WHERE username = ?', [username]);
    return res.json({ message: 'OK' });
  } catch (error) {
    logError('Delete user error', error);
    return res.status(400).json({ error: `Delete user failed: ${error.message}` });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    return res.json({ message: 'Registration successful' });
  } catch (error) {
    logError('Register error', error);

    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/auth', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      username: user.username
    });
  } catch (error) {
    logError('Auth error', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
});

app.get('/query', async (req, res) => {
  const sqlQuery = req.query.sql;

  if (!sqlQuery) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  try {
    const rows = await db.all(sqlQuery);
    return res.json({ data: rows });
  } catch (error) {
    console.error('Query error:', error.message, 'SQL:', sqlQuery);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/query', async (req, res) => {
  const { sql, params } = req.body;

  if (!sql || !Array.isArray(params)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  try {
    const result = await db.run(sql, params);
    return res.json({ message: 'Query executed successfully', changes: result.changes });
  } catch (error) {
    console.error('Mutation error:', error.message, 'SQL:', sql, 'params:', params);
    return res.status(500).json({ error: error.message });
  }
});

initDatabase();
