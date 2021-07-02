const { ApolloServer } = require('apollo-server');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const conectarDB = require('./config/db');

// Conectar a la base de datos
conectarDB();

// Servidor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // console.log(req.headers);
    // console.log(req.header['authorization']);
    const token = req.headers['authorization'] || null;
    if (token) {
      try {
        const usuario = jwt.verify(token, process.env.SECRETA);
        return { usuario };
      } catch (error) {
        console.log('Error en Token');
      }
    }
  },
});

// Arrancar el servidor
server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`Servidor Apollo listo en la URL ${url}`);
});
