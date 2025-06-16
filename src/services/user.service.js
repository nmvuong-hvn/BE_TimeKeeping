const User = require('../models/user.model');
const Device = require('../models/device.model');
const mongoose = require('mongoose');
const { locale } = require('moment/moment');

const getAllUsers = async () => {
    try {
        const users = await User.find({ role: { $ne: 'superadmin' } })
            .select('-password') // Exclude password field
            .lean();
        
        return users;
    } catch (error) {
        throw error;
    }
};

const getUserById = async (id) => {
    return await User.findById(id).select('-password');
};

const getUserByUsername = async (username) => {
    return await User.findOne({ username });
};

const createUser = async (userData) => {
    const newUser = new User(userData);
    return await newUser.save();
};

const updateUser = async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
};

const deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

const assignDevices = async (adminId, deviceIds) => {
    try {
        console.log("Starting assignDevices service with:", { adminId, deviceIds });

        // Convert adminId to ObjectId
        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        console.log("Converted adminId to ObjectId:", adminObjectId);

        // Check if admin exists and is actually an admin
        console.log("Finding admin with query:", { _id: adminObjectId, role: 'admin' });
        const admin = await User.findOne({ _id: adminObjectId, role: 'admin' });
        console.log("Found admin:", admin);
        
        if (!admin) {
            console.log("Admin not found or not an admin");
            throw new Error('Admin not found or user is not an admin');
        }

        // Verify all devices exist
        console.log("Verifying devices exist:", deviceIds);
        const devices = await Device.find({ deviceId: { $in: deviceIds } });
        console.log("Found devices:", devices);
        
        if (devices.length !== deviceIds.length) {
            console.log("Some devices not found. Expected:", deviceIds.length, "Found:", devices.length);
            throw new Error('One or more devices not found');
        }

        // Update admin's devices array
        console.log("Updating admin devices. AdminId:", adminObjectId, "Devices:", deviceIds);
        const updatedAdmin = await User.findByIdAndUpdate(
            adminObjectId,
            { 
                $set: { devices: deviceIds },
                updatedAt: Date.now()
            },
            { new: true }
        ).select('-password');

        console.log("Update result:", updatedAdmin);

        if (!updatedAdmin) {
            console.log("Failed to update admin devices");
            throw new Error('Failed to update admin devices');
        }

        return updatedAdmin;
    } catch (error) {
        console.error("Error in assignDevices service:", error);
        throw error;
    }
};

const userService = {
    getAllUsers,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser,
    assignDevices
};

module.exports = userService; 