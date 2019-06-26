import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Durval Printes',
    email: 'durvalprintes@gmail.com',
    password_hash: '1234567890',
  });
  res.json(user);
});

export default routes;
