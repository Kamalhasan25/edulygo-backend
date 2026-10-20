require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('ডেটাবেস কানেকশন এরর:', err.message);
    }
    console.log('অভিনন্দন! Supabase ক্লাউড ডেটাবেস সফলভাবে কানেক্ট হয়েছে।');
    release();
});

module.exports = pool;
