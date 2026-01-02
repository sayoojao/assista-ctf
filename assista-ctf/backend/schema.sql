-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id),
  content TEXT NOT NULL,
  difficulty VARCHAR(50) NOT NULL, -- EASY, MEDIUM, HARD
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Options Table
CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT 0
);

-- Quiz Sessions Table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_score INTEGER DEFAULT 0
);

-- User Responses Table
CREATE TABLE IF NOT EXISTS user_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id),
  selected_option_id INTEGER REFERENCES options(id),
  is_correct BOOLEAN
);

-- Quiz Settings Table
CREATE TABLE IF NOT EXISTS quiz_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_active BOOLEAN DEFAULT 0,
  start_time TIMESTAMP,
  duration_minutes INTEGER DEFAULT 0
);
