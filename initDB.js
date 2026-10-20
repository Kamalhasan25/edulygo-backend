const pool = require('./db');

const createTables = async () => {
    const queryText = `
    -- ১. স্কুল টেবিল
    CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ২. ইউজার টেবিল
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, email)
    );

    -- ৩. শিক্ষক টেবিল
    CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(100),
        designation VARCHAR(100) DEFAULT 'Assistant Teacher',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ৪. ছাত্রছাত্রী টেবিল
    CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        roll_no INTEGER NOT NULL,
        guardian_phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, class_name, roll_no)
    );

    -- ৫. দৈনিক হাজিরা টেবিল
    CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        status VARCHAR(10) CHECK (status IN ('Present', 'Absent', 'Late')) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, student_id, date)
    );

    -- ৬. ফি টেবিল
    CREATE TABLE IF NOT EXISTS fees (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        fee_type VARCHAR(100) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        paid_amount NUMERIC(10, 2) DEFAULT 0.00,
        due_date DATE,
        status VARCHAR(20) DEFAULT 'Pending',
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ৭. পরীক্ষা তালিকা টেবিল (Exams)
    CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        term VARCHAR(50),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ৮. পরীক্ষার নম্বর টেবিল (Marks)
    CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        subject VARCHAR(100) NOT NULL,
        max_marks NUMERIC(5, 2) DEFAULT 100.00,
        obtained_marks NUMERIC(5, 2) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, exam_id, student_id, subject)
    );
    `;

    try {
        console.log('পরীক্ষা ও নম্বর টেবিল তৈরির কাজ শুরু হচ্ছে...');
        await pool.query(queryText);
        console.log('অভিনন্দন! exams এবং marks টেবিল সফলভাবে তৈরি হয়েছে।');
        process.exit(0);
    } catch (err) {
        console.error('টেবিল তৈরিতে এরর:', err.message);
        process.exit(1);
    }
};

createTables();
