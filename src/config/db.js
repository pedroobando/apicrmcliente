const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log('DB Conected..');
  } catch (error) {
    console.log('Hubo un error');
    console.log(error);
    process.exit(1);
  }
};

module.exports = conectarDB;
