const { Schema, model } = require('mongoose');

const dataTypeDefault = {
  type: String,
  required: true,
  trim: true,
};

const ClienteSchema = Schema({
  nombre: {
    ...dataTypeDefault,
  },
  apellido: {
    ...dataTypeDefault,
  },
  empresa: {
    ...dataTypeDefault,
  },
  email: {
    ...dataTypeDefault,
    unique: true,
  },
  telefono: {
    ...dataTypeDefault,
    required: false,
  },
  vendedor: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Usuario',
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = model('Cliente', ClienteSchema);
