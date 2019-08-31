require('dotenv/config');

module.exports = {
  dialect: 'postgres',
  // host: '192.168.99.100',
  // password: 'docker',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
