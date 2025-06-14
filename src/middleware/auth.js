const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded = ", decoded);
        const user = await User.findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
        console.log("user = ", user);
        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Please authenticate.' });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Forbidden: Superadmin access required.' });
    }
    next();
};

const requireAdminOrSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Forbidden: Admin or Superadmin access required.' });
    }
    next();
};

const deviceAccess = (req, res, next) => {
    if (req.user.role === 'superadmin') {
        // Superadmin bypasses deviceId checks
        return next();
    }

    if (req.user.role === 'admin') {
        const adminDevices = req.user.devices;

        // For GET requests, if no specific deviceId is provided, allow access to all assigned devices
        if (req.method === 'GET') {
            if (req.query.deviceId) {
                // If deviceId is provided, check if it's in the admin's assigned devices
                if (!adminDevices.includes(req.query.deviceId)) {
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this device.' });
                }
            } else {
                // If no deviceId is provided, allow access to all devices assigned to the admin
                // The controller will need to filter by req.user.devices
            }
            return next();
        }

        // For non-GET requests (POST, PUT, DELETE), deviceId is mandatory and must be in assigned devices
        const deviceId = req.body.deviceId || req.params.deviceId || req.query.deviceId;
        if (!deviceId) {
            return res.status(400).json({ message: 'Bad Request: deviceId is required for this operation.' });
        }

        if (!adminDevices.includes(deviceId)) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this device.' });
        }

        // Attach deviceId to request for controller to use
        req.currentDeviceId = deviceId;
        next();
    }
};

module.exports = {
    auth,
    requireSuperAdmin,
    requireAdminOrSuperAdmin,
    deviceAccess
}; 