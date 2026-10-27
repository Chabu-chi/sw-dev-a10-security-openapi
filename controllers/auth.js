const User = require('../models/User');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.cookie('token', token, { httpOnly: true });
  res.status(statusCode).json({ success: true, token });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, tel } = req.body;
    // Public registration must never be able to create an administrator.
    const user = await User.create({ name, email, password, tel, role: 'user' });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, data: {} });
};
