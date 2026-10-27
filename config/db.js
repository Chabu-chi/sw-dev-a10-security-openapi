const mongoose = require('mongoose');

module.exports = async function connectDB() {
  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${connection.connection.host}`);
  return connection;
};
