const deviceService = require('../services/device.service');

const getAllDevices = async (req, res) => {
    try {
        const devices = await deviceService.getAllDevices();
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDeviceById = async (req, res) => {
    try {
        const device = await deviceService.getDeviceById(req.params.id);
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }
        res.status(200).json(device);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createDevice = async (req, res) => {
    try {
        const existingDevice = await deviceService.getDeviceByDeviceId(req.body.deviceId);
        if (existingDevice) {
            return res.status(409).json({ message: 'Device with this deviceId already exists' });
        }
        const newDevice = await deviceService.createDevice(req.body);
        res.status(201).json(newDevice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateDevice = async (req, res) => {
    try {
        const updatedDevice = await deviceService.updateDevice(req.params.id, req.body);
        if (!updatedDevice) {
            return res.status(404).json({ message: 'Device not found' });
        }
        res.status(200).json(updatedDevice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteDevice = async (req, res) => {
    try {
        const deletedDevice = await deviceService.deleteDevice(req.params.id);
        if (!deletedDevice) {
            return res.status(404).json({ message: 'Device not found' });
        }
        res.status(200).json({ message: 'Device deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice
};    