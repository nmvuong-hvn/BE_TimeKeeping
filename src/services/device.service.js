const Device = require('../models/device.model');

const getAllDevices = async () => {
    return await Device.find();
};

const getDeviceById = async (id) => {
    return await Device.findById(id);
};

const getDeviceByDeviceId = async (deviceId) => {
    return await Device.findOne({ deviceId });
};

const createDevice = async (deviceData) => {
    const newDevice = new Device(deviceData);
    return await newDevice.save();
};

const updateDevice = async (id, updateData) => {
    return await Device.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteDevice = async (id) => {
    return await Device.findByIdAndDelete(id);
};

module.exports = {
    getAllDevices,
    getDeviceById,
    getDeviceByDeviceId,
    createDevice,
    updateDevice,
    deleteDevice
}; 