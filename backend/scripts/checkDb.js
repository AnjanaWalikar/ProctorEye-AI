import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Exam from '../models/examModel.js';

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/proctoreyai';

async function run() {
  try {
    await mongoose.connect(mongoUrl);
    console.log('Connected to', mongoUrl);

    const userCount = await User.countDocuments();
    const examCount = await Exam.countDocuments();

    console.log('Users count:', userCount);
    console.log('Exams count:', examCount);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error checking DB:', err.message || err);
    process.exit(1);
  }
}

run();
