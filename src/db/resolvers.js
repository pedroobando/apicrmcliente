const query = require('./querys');
const mutations = require('./mutations');
const type = require('./types');

require('dotenv').config();

const resolvers = {
  ...query,
  ...mutations,
  ...type,
};

module.exports = resolvers;
