const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const type = require('./type');

const querys = {
  Query: {
    obtenerUsuario: (_, {}, ctx) => {
      // console.log(ctx.usuario);
      // console.log(ctx.authScope);
      return ctx.usuario;
      // try {
      //   const usuarioId = await jwt.verify(token, process.env.SECRETA);
      //   return usuarioId;
      // } catch (error) {
      //   console.log(error);
      // }
    },

    obtenerUsuarios: async () => {
      const listaUsuarios = await Usuario.find({});
      return [...listaUsuarios];
    },

    obtenerProductos: async () => {
      try {
        const listaProductos = await Producto.find({});
        return listaProductos;
      } catch (error) {
        console.log(error);
      }
    },

    obtenerProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error(`El id del producto no esta registrado.`);
      }
      return producto;
    },

    obtenerClientes: async () => {
      try {
        const listaClientes = await Cliente.find({});
        return listaClientes;
      } catch (error) {
        console.log(error);
      }
    },

    obtenerClientesVendedor: async (_, {}, ctx) => {
      try {
        const { id } = ctx.usuario;
        const listaClientes = await Cliente.find({ vendedor: id.toString() });
        return listaClientes;
      } catch (error) {
        console.log(error);
      }
    },

    obtenerCliente: async (_, { id }, ctx) => {
      const { id: vendId } = ctx.usuario;
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error(`El id del cliente no esta registrado.`);
      }

      // console.log(cliente.vendedor.toString(), ctx.usuario.id.toString());

      if (cliente.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error('No tiene las credenciales');
      }

      return cliente;
    },

    obtenerPedidos: async () => {
      try {
        const listaPedidos = await Pedido.find({});
        return listaPedidos;
      } catch (error) {
        console.log(error);
      }
    },

    obtenerPedidosVendedor: async (_, {}, ctx) => {
      const listaPedidos = await Pedido.find({ vendedor: ctx.usuario.id }).populate(
        'cliente'
      );
      if (!listaPedidos) {
        throw new Error(`El vendedor no tiene pedidos registrados.`);
      }

      return listaPedidos;
    },

    obtenerPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) throw new Error(`El pedido no localizado`);

      if (pedido.vendedor.toString() !== ctx.usuario.id.toString())
        throw new Error(`El pedido no esta asignado al vendedor`);

      return pedido;
    },

    obtenerPedidosEstado: async (_, { estado }, ctx) => {
      //
      const listaPedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });
      if (!listaPedidos) {
        throw new Error(`El vendedor no tiene pedidos registrados.`);
      }

      return listaPedidos;
    },

    mejoresClientes: async () => {
      const cliente = await Pedido.aggregate([
        { $match: { estado: 'COMPLETADO' } },
        {
          $group: {
            _id: '$cliente',
            total: { $sum: '$total' },
          },
        },
        {
          $lookup: {
            from: 'clientes',
            localField: '_id',
            foreignField: '_id',
            as: 'cliente',
          },
        },
        {
          $limit: 5,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return cliente;
    },

    mejoresVendedores: async () => {
      const vendedores = await Pedido.aggregate([
        { $match: { estado: 'COMPLETADO' } },
        {
          $group: {
            _id: '$vendedor',
            total: { $sum: '$total' },
          },
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: '_id',
            as: 'vendedor',
          },
        },
        {
          $limit: 3,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return vendedores;
    },
    buscarProducto: async (_, { texto }) => {
      const productos = await Producto.find({ $text: { $search: texto } }).limit(20);
      return productos;
    },
  },
};

module.exports = querys;
