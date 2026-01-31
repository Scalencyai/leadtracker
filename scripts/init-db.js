// Initialize PostgreSQL database schema
const { initDb } = require('../lib/db');

async function main() {
  try {
    console.log('🔧 Initializing database schema...');
    await initDb();
    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
