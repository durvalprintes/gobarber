import * as Yup from 'yup';
import { startOfHour, parse, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notifications from '../schemas/Notifications';
import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (isProvider) {
      return res.status(401).json({ error: 'User is a Provider!' });
    }

    const { page = 1 } = req.query;

    const appointment = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(appointment);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res.status(401).json({ error: 'User is not a Provider!' });
    }

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data Appointment is not valid!' });
    }

    const hourStart = startOfHour(parse(date));
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Date is not valid!' });
    }

    const checkAppointment = await Appointment.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });

    if (checkAppointment) {
      return res.status(400).json({
        error: 'Appointment date with this provider is not avaliable!',
      });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    const { name } = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, 'DD [de] MMMM[, às] H:mm[h]', {
      locale: pt,
    });

    await Notifications.create({
      content: `New appointment of ${name} at ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (isProvider) {
      return res.status(401).json({ error: 'User is a Provider!' });
    }

    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({ error: 'User dont have permission!' });
    }

    const limitHour = subHours(appointment.date, 2);
    if (isBefore(limitHour, new Date())) {
      return res.status(401).json({ error: 'Limit time to cancel is exced!' });
    }

    appointment.canceled_at = new Date();

    appointment.save();

    await Mail.sendMail({
      to: `${appointment.provider.name}<${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, 'DD [de] MMMM[, às] H:mm[h]', {
          locale: pt,
        }),
      },
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
