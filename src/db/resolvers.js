const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const crearToken = (usuario, secret, expiresIn) => {
  // console.log(usuario, expiresIn);
  const { id, nombre, apellido } = usuario;
  return jwt.sign({ id, nombre, apellido }, secret, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerUsuario: (_, {}, ctx) => {
      // console.log(ctx.usuario);
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

  Mutation: {
    nuevoUsuario: async (__, { usuario }) => {
      const { email, password } = usuario;

      // Revisar si el usuario existe
      const usuarioExiste = await Usuario.findOne({ email });
      if (usuarioExiste) {
        throw new Error(`El email ${email} ya esta registrado.`);
      }
      try {
        // Hashear su password
        const salt = await bcryptjs.genSalt(10);
        usuario.password = await bcryptjs.hash(password, salt);

        // Guardar en base de datos
        const nuevoUsuario = new Usuario(usuario);
        nuevoUsuario.save();
        return nuevoUsuario;
      } catch (error) {
        console.log(error);
      }
    },

    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      // Si el usuario existe
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error(`El usuario no existe..!`);
      }

      // Revisar si el password es correcto
      const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
      if (!passwordCorrecto) {
        throw new Error('El Password es Incorrecto');
      }

      // Crear el token
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h'),
      };
    },

    nuevoProducto: async (__, { input }) => {
      const { nombre } = input;

      // Si el usuario existe
      const existeProducto = await Producto.findOne({ nombre });
      if (existeProducto) {
        throw new Error(`El producto ${nombre} ya esta registrado..!`);
      }

      // Guardar en base de datos
      const nuevoProducto = new Producto(input);
      nuevoProducto.save();
      return nuevoProducto;
    },

    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id);

      if (!producto) throw new Error('Producto no encontrado');

      producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });

      return producto;
    },

    eliminarProducto: async (_, { id }) => {
      let producto = await Producto.findById(id);

      if (!producto) throw new Error('Producto no encontrado');

      await Producto.findByIdAndDelete(id);

      return 'Producto Eliminado';
    },

    nuevoCliente: async (_, { input }, ctx) => {
      const { email } = input;
      const { id } = ctx.usuario;
      // Si el usuario existe
      const existeCliente = await Cliente.findOne({ email });
      if (existeCliente) {
        throw new Error(`El email de cliente ${email} ya esta registrado..!`);
      }

      // Guardar en base de datos
      try {
        const nuevoCliente = new Cliente(input);
        nuevoCliente.vendedor = id;
        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (error) {
        throw new Error(error);
      }
    },

    actualizarCliente: async (_, { id, input }, ctx) => {
      let cliente = await Cliente.findById(id);

      if (!cliente) throw new Error('Cliente no encontrado');

      if (cliente.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error('No tiene las credenciales');
      }

      const { email } = input;
      const existeCliente = await Cliente.findOne({ email });
      if (!!existeCliente && existeCliente.id !== id)
        throw new Error(
          `Email ${email} registrado ya en cliente ${existeCliente.nombre} ${existeCliente.apellido}.`
        );

      cliente = await Cliente.findByIdAndUpdate(id, input, { new: true });
      return cliente;
    },

    eliminarCliente: async (_, { id }, ctx) => {
      const cliente = await Cliente.findById(id);

      if (!cliente) throw new Error('Cliente no encontrado');

      if (cliente.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error('No tiene las credenciales');
      }

      try {
        await Cliente.findByIdAndDelete(id);
        return 'Cliente Eliminado';
      } catch (error) {
        console.log(error);
      }
    },

    nuevoPedido: async (_, { input }, ctx) => {
      // console.log(input);
      const { cliente } = input;

      // verificacion del cliente
      const clienteExiste = await Cliente.findById(cliente);

      if (!clienteExiste) throw new Error('Cliente no encontrado');

      // verificacion si el cliente es del vendedor
      if (clienteExiste.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error('Cliente no asignado a este vendedor');
      }

      let _total = 0;
      // verificar si hay disponibilidad en stock
      for await (const articulo of input.pedido) {
        // console.log(articulo.id.toString());
        const producto = await Producto.findById(articulo.producto.toString());
        if (!producto) {
          throw new Error(`Producto ${articulo.producto} no existe.!`);
        }

        if (articulo.cantidad > producto.existencia) {
          throw new Error(
            `El articulo: ${producto.nombre} excede la cantidad disponible.`
          );
        } else {
          // Resta la cantidad a lo disponible
          producto.existencia = producto.existencia - articulo.cantidad;
          await producto.save();
          // await Producto.findByIdAndUpdate(producto.producto, producto);
        }

        articulo.precio = producto.precio;
        _total += articulo.cantidad * producto.precio;
      }

      const creacionPedido = new Pedido(input);
      // asignar un vendedor
      creacionPedido.vendedor = ctx.usuario.id.toString();
      creacionPedido.total = _total;

      // grabar el pedido
      const nuevoPedido = await creacionPedido.save();
      return nuevoPedido;
    },

    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente } = input;
      // verificacion del pedido
      const pedidoExiste = await Pedido.findById(id);
      if (!pedidoExiste) throw new Error('El Pedido no fue encontrado.');

      // verificacion si el cliente es del vendedor
      if (pedidoExiste.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error('No posee credenciales para esta accion');
      }

      // vefificacion de cliente existe
      const clienteExiste = await Cliente.findById(cliente);
      if (!clienteExiste) throw new Error('El Cliente no existe.');

      // verificar si el cliente esta asignado al vendedor
      if (clienteExiste.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error(
          `No posee credenciales para trabajar con este Cliente ${clienteExiste.nombre}  ${clienteExiste.apellido}`
        );
      }

      if (input.pedido) {
        // verificar si hay disponibilidad en stock
        let _total = 0;
        for await (const articulo of input.pedido) {
          // console.log(articulo.id.toString());
          const producto = await Producto.findById(articulo.producto.toString());
          if (!producto) {
            throw new Error(`Producto ${articulo.producto} no existe.!`);
          }

          if (articulo.cantidad > producto.existencia) {
            throw new Error(
              `El articulo: ${producto.nombre} excede la cantidad disponible.`
            );
          } else {
            // Resta la cantidad a lo disponible
            producto.existencia = producto.existencia - articulo.cantidad;
            await Producto.findByIdAndUpdate(producto.producto, producto);
          }

          articulo.precio = producto.precio;
          _total += articulo.cantidad * producto.precio;
        }
        input.total = _total;
      }

      const resultado = await Pedido.findByIdAndUpdate(id, input, { new: true });
      return resultado;
    },

    eliminarPedido: async (_, { id }, ctx) => {
      // Verificar pedido si existe
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error('El pedido no existe.');
      }

      // verificacion si el cliente es del vendedor
      if (pedido.vendedor.toString() !== ctx.usuario.id.toString()) {
        throw new Error('No tiene las credenciales');
      }

      await Pedido.findByIdAndDelete(id);
      return 'Pedido Eliminado';
    },
  },
};

module.exports = resolvers;
