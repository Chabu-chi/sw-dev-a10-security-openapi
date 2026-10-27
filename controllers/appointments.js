const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

const populated = (query) => query.populate({ path: 'hospital', select: 'name address province tel' });

exports.getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.params.hospitalId) filter.hospital = req.params.hospitalId;
    if (req.user.role !== 'admin') filter.user = req.user.id;

    const appointments = await populated(Appointment.find(filter));
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cannot find appointments' });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await populated(Appointment.findById(req.params.id));
    if (!appointment) {
      return res.status(404).json({ success: false, message: `No appointment with id ${req.params.id}` });
    }
    if (req.user.role !== 'admin' && appointment.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this appointment' });
    }
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cannot find appointment' });
  }
};

exports.addAppointment = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: `No hospital with id ${req.params.hospitalId}` });
    }

    if (req.user.role !== 'admin') {
      const count = await Appointment.countDocuments({ user: req.user.id });
      if (count >= 3) {
        return res.status(400).json({
          success: false,
          message: `The user with ID ${req.user.id} has already made 3 appointments`
        });
      }
    }

    const appointment = await Appointment.create({
      apptDate: req.body.apptDate,
      hospital: hospital._id,
      user: req.user.id
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (req.user.role !== 'admin' && appointment.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this appointment' });
    }

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { apptDate: req.body.apptDate },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: appointment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (req.user.role !== 'admin' && appointment.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this appointment' });
    }
    await appointment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cannot delete appointment' });
  }
};
