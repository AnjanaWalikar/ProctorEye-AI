import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/proctoreyai";
let _memoryServer = null;
const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log(`MongoDB Connected: ${mongoUrl}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // If hostname resolution attempted IPv6 (::1) or localhost, try IPv4 loopback explicitly
    try {
      const ipv4Url = mongoUrl.includes('localhost') || mongoUrl.includes('::1') ? mongoUrl.replace('localhost', '127.0.0.1').replace('::1', '127.0.0.1') : mongoUrl;
      if (ipv4Url !== mongoUrl) {
        await mongoose.connect(ipv4Url);
        console.log(`MongoDB Connected (ipv4): ${ipv4Url}`);
        return;
      }
    } catch (ipv4Err) {
      console.error('IPv4 connection attempt failed:', ipv4Err.message);
    }

    console.warn('Falling back to in-memory MongoDB for development.');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      _memoryServer = await MongoMemoryServer.create();
      const uri = _memoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`MongoDB Connected (in-memory): ${uri}`);
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB:', memErr);
      throw memErr;
    }
  }
};

export default connectDB;
