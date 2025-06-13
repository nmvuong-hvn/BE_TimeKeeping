const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { username, password, role, devices } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!['superadmin', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash, role, devices: role === 'admin' ? devices : [] });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
      devices: user.devices
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        role: user.role,
        devices: user.devices
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
