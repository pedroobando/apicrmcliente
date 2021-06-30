const { Schema, model } = require('mongoose');

const PedidoGrupoSchema = Schema({
  producto: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Producto',
  },
  cantidad: {
    type: Number,
    required: true,
    default: 0,
  },
  precio: {
    type: Number,
    required: true,
    default: 0,
  },
});

const PedidoSchema = Schema({
  pedido: [PedidoGrupoSchema],
  total: {
    type: Number,
    required: true,
  },
  cliente: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Cliente',
  },
  vendedor: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Usuario',
  },
  estado: {
    type: String,
    required: true,
    default: 'PENDIENTE',
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = model('Pedido', PedidoSchema);
