import * as Yup from 'yup';
import { startOfHour, parse, isBefore } from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { provider: true, id: provider_id },
    });
    if (!isProvider) {
      return res.status(400).json({ error: 'User is not a Provider!' });
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
    return res.json(appointment);
  }
}

export default new AppointmentController();
