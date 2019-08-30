module.exports = {
  dialect: 'postgres',
  // host: '192.168.99.100',
  // password: 'docker',
  host: 'bootcamp.c0cx71hgmjoo.sa-east-1.rds.amazonaws.com',
  username: 'postgres',
  password: 'AmazonP057',
  database: 'gobarber',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
