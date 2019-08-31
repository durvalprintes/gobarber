import 'dotenv/config';

export default {
  secret: process.env.KEY_SECRET,
  expires: '7d',
};
