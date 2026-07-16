const session = require('express-session');

function createSessionMiddleware(pool) {
  if (!pool) {
    console.warn('⚠️  No database pool — using in-memory sessions (non-persistent)');
    return session({
      secret: process.env.SESSION_SECRET || 'agrichain360_session_secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      }
    });
  }

  try {
    const pgSession = require('connect-pg-simple')(session);
    return session({
      store: new pgSession({
        pool,
        tableName: 'sessions',
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'agrichain360_session_secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      }
    });
  } catch (err) {
    console.error('❌ Failed to create PG session store:', err.message);
    console.warn('⚠️  Falling back to in-memory sessions');
    return session({
      secret: process.env.SESSION_SECRET || 'agrichain360_session_secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true }
    });
  }
}

module.exports = { createSessionMiddleware };
