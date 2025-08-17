const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 9000;
const addr = "localhost"
let db;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

function initDatabase() {
  open({
    filename: './Data.db',
    driver: sqlite3.Database
  })
    .then((database) => {
      db = database;
      console.log('Подключение к базе данных успешно');

      // Создаем таблицу пользователей, если она не существует
      console.log('Создание таблицы users...');
      return db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        )
      `);
    })
    .then(() => {
      console.log('Таблица users успешно создана');
      app.listen(port, addr, () => {
        console.log(`Сервер запущен на порту ${port}`);
      });
    })
    .catch((error) => {
      console.error('Ошибка инициализации базы данных:', error);
      console.error('Детали ошибки:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
    });
}

// Middleware для обработки JSON
app.use(express.json());

// Эндпоинт для регистрации

app.post('/deluser', async (req, res) => {
  try
  {
    const { username } = req.body;
    console.log(username)
    await db.run(
      `DELETE FROM users WHERE username = '${username}'`
    )
    return res.json({message: 'OK'})
  } catch(e)
  {
    console.log(`Error while deliting user: ${e}` )
    return res.status(400).json({ error: `Ошибка при удалении пользователя, ${e}`})
  }
})
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  try {
    console.log('Начало регистрации пользователя:', username);
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Пароль успешно захеширован');
    
    // Сохраняем пользователя в базу данных
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    console.log('Пользователь успешно добавлен в базу данных');
    res.json({ message: 'Регистрация успешна' });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    console.error('Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    } else {
      res.status(500).json({ 
        error: 'Ошибка при регистрации',
        details: error.message 
      });
    }
  }
});

// Эндпоинт для авторизации
app.post('/auth', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  try {
    // Получаем пользователя из базы данных
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при авторизации' });
  }
});

// Обработчик GET-запросов (только SELECT)
app.get('/query', (req, res) => {
  const sqlQuery = req.query.sql;

  if (!sqlQuery) {
    return res.status(400).json({ error: 'SQL-запрос не указан' });
  }

  db.all(sqlQuery)
    .then((rows) => {
      res.json({ data: rows });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});


app.post('/query', (req, res) => {
  const { sql, params } = req.body;

  if (!sql || !Array.isArray(params)) {
    return res.status(400).json({ error: 'Некорректный формат запроса' });
  }

  db.run(sql, params)
    .then((result) => {
      res.json({ message: 'Запрос выполнен успешно', changes: result.changes });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});


initDatabase();
