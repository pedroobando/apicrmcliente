const { Schema, model } = require('mongoose');

const dataTypeDefault = {
  type: String,
  required: true,
  trim: true,
};

const UsuarioSchema = Schema({
  nombre: {
    ...dataTypeDefault,
  },
  apellido: {
    ...dataTypeDefault,
  },
  email: {
    ...dataTypeDefault,
    unique: true,
  },
  password: {
    ...dataTypeDefault,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = model('Usuario', UsuarioSchema);
