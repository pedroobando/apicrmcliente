const { Schema, model } = require('mongoose');

const dataTypeDefault = {
  type: Number,
  required: true,
  trim: true,
};

const ProductoSchema = Schema({
  nombre: {
    ...dataTypeDefault,
    type: String,
  },
  existencia: {
    ...dataTypeDefault,
  },
  precio: {
    ...dataTypeDefault,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

ProductoSchema.index({ nombre: 'text' });

module.exports = model('Producto', ProductoSchema);
