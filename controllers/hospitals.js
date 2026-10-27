const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

exports.getHospitals = async (req, res) => {
  try {
    const reqQuery = { ...req.query };
    ['select', 'sort', 'page', 'limit'].forEach((field) => delete reqQuery[field]);
    const queryString = JSON.stringify(reqQuery).replace(/\b(gt|gte|lt|lte|in)\b/g, (key) => `$${key}`);
    const filter = JSON.parse(queryString);

    let query = Hospital.find(filter).populate('appointments');
    if (req.query.select) query = query.select(req.query.select.split(',').join(' '));
    query = req.query.sort
      ? query.sort(req.query.sort.split(',').join(' '))
      : query.sort('-createdAt');

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 25, 1);
    const startIndex = (page - 1) * limit;
    const total = await Hospital.countDocuments(filter);
    const hospitals = await query.skip(startIndex).limit(limit);
    const pagination = {};

    if (startIndex + limit < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({ success: true, count: hospitals.length, pagination, data: hospitals });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(400).json({ success: false });
    res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, data: hospital });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!hospital) return res.status(400).json({ success: false });
    res.status(200).json({ success: true, data: hospital });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: `Hospital not found with id ${req.params.id}` });
    }

    await Appointment.deleteMany({ hospital: hospital._id });
    await hospital.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
