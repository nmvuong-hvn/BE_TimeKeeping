const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Chỉ cho phép superadmin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: Superadmin only' });
  }
  next();
};

// Cho phép superadmin hoặc admin
const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// Phân quyền theo deviceId (nếu là admin)
const deviceAccess = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  const deviceId = req.params.deviceId || req.body.deviceId || req.query.deviceId;
  if (!deviceId) return res.status(400).json({ message: 'Missing deviceId' });
  if (!req.user.devices || !req.user.devices.includes(deviceId)) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập thiết bị này' });
  }
  next();
};

module.exports = {
  auth,
  requireSuperAdmin,
  requireAdminOrSuperAdmin,
  deviceAccess
};
