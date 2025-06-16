const userService = require('../services/user.service');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        
        return res.status(200).json({
            status: 200,
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        return res.status(500).json({
            status: 500,
            message: error.message,
            data: null
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Getting user by ID:", id);

        const user = await userService.getUserById(id);
        console.log("Found user:", user);

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: 'User not found',
                data: null
            });
        }

        return res.status(200).json({
            status: 200,
            message: 'User retrieved successfully',
            data: {
                _id: user._id,
                username: user.username,
                role: user.role,
                devices: user.devices
            }
        });
    } catch (error) {
        console.error('Error in getUserById:', error);
        return res.status(500).json({
            status: 500,
            message: error.message,
            data: null
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, password, role, devices } = req.body;
        console.log("req.body = ", req.body);

        // Check if user already exists
        const existingUser = await userService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userService.createUser({
            username,
            password: hashedPassword,
            role,
            devices: role === 'admin' ? (devices || []) : [] // Only assign devices if role is admin
        });
        console.log("newUser = ", newUser)
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { username, password, role, devices } = req.body;
        const userId = req.params.id;

        const updateData = {};
        if (username) updateData.username = username;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (role) updateData.role = role;
        if (role === 'admin') {
            updateData.devices = devices || [];
        } else if (role && role !== 'admin') {
            updateData.devices = []; // Clear devices if role changes from admin to something else
        }

        const updatedUser = await userService.updateUser(userId, updateData);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const assignDevices = async (req, res) => {
    try {
        console.log("Assign devices request body:", req.body);
        const { adminId, deviceIds } = req.body;

        if (!adminId || !deviceIds || !Array.isArray(deviceIds)) {
            console.log("Validation failed - Missing required fields");
            return res.status(400).json({
                status: 400,
                message: 'Admin ID and array of device IDs are required',
                data: null
            });
        }

        console.log("Calling userService.assignDevices with:", { adminId, deviceIds });
        const updatedAdmin = await userService.assignDevices(adminId, deviceIds);
        console.log("Updated admin result:", updatedAdmin);
        
        return res.status(200).json({
            status: 200,
            message: 'Devices assigned successfully',
            data: {
                _id: updatedAdmin._id,
                username: updatedAdmin.username,
                role: updatedAdmin.role,
                devices: updatedAdmin.devices
            }
        });
    } catch (error) {
        console.error('Error in assignDevices:', error);
        
        if (error.message.includes('Invalid admin ID format')) {
            return res.status(400).json({
                status: 400,
                message: error.message,
                data: null
            });
        }

        if (error.message.includes('Admin not found')) {
            return res.status(404).json({
                status: 404,
                message: error.message,
                data: null
            });
        }
        
        if (error.message.includes('devices not found')) {
            return res.status(400).json({
                status: 400,
                message: error.message,
                data: null
            });
        }

        return res.status(500).json({
            status: 500,
            message: error.message,
            data: null
        });
    }
};

const userController = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    assignDevices
};

module.exports = userController; 