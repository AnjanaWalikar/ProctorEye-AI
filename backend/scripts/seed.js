import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Exam from '../models/examModel.js';

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/proctoreyai';

async function seed() {
  try {
    await mongoose.connect(mongoUrl);
    console.log('Connected to', mongoUrl);

    const userCount = await User.countDocuments();
    const examCount = await Exam.countDocuments();

    if (userCount === 0) {
      console.log('Seeding users...');
      await User.create([
        { name: 'Teacher One', email: 'teacher@example.com', password: 'Password123!', role: 'teacher' },
        { name: 'Student One', email: 'student@example.com', password: 'Password123!', role: 'student' },
      ]);
      console.log('Users seeded.');
    } else {
      console.log('Users already present, skipping user seed.');
    }

    if (examCount === 0) {
      console.log('Seeding exams...');
      const now = new Date();
      await Exam.create([
        {
          examName: 'Sample MCQ Exam',
          examType: 'mcq',
          totalQuestions: 20,
          duration: 30,
          liveDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          deadDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          examName: 'Sample Coding Exam',
          examType: 'coding',
          totalQuestions: 1,
          duration: 60,
          liveDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          deadDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        },
      ]);
      console.log('Exams seeded.');
    } else {
      console.log('Exams already present, skipping exam seed.');
    }

    const finalUserCount = await User.countDocuments();
    const finalExamCount = await Exam.countDocuments();
    console.log('Final Users count:', finalUserCount);
    console.log('Final Exams count:', finalExamCount);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message || err);
    process.exit(1);
  }
}

seed();
