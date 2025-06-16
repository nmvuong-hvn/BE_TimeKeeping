const Device = require('../models/device.model');
const User = require('../models/user.model');

const deviceService = {
  getAllDevices: async (userId) => {
    try {
      const query = userId ? { userId } : {};
      const devices = await Device.find(query)
        .lean();
      
      return devices || []; // Return empty array if no devices found
    } catch (error) {
      throw error;
    }
  },

  getDeviceById: async (deviceId, userId) => {
    try {
      const query = { _id: deviceId };
      if (userId) {
        query.userId = userId;
      }
      const device = await Device.findOne(query)
        .populate('userId', 'username role')
        .lean();
      
      return device;
    } catch (error) {
      throw error;
    }
  },

  getDeviceByDeviceId: async (deviceId) => {
    return await Device.findOne({ deviceId });
  },

  createDevice: async (deviceData) => {
    try {
      const newDevice = await Device.create(deviceData);
      return newDevice;
    } catch (error) {
      throw error;
    }
  },

  updateDevice: async (id, updateData, userId) => {
    try {
      const query = { deviceId: id };
      if (userId) {
        query.userId = userId;
      }
      const updatedDevice = await Device.findOneAndUpdate(
        query,
        updateData,
        { new: true }
      );
      
      return updatedDevice;
    } catch (error) {
      throw error;
    }
  },

  deleteDevice: async (id, userId) => {
    try {
      const query = { deviceId: id };
      if (userId) {
        query.userId = userId;
      }

      // Find the device first to get its deviceId
      const device = await Device.findOne(query);
      if (!device) {
        return null;
      }

      // Delete the device
      const deletedDevice = await Device.findOneAndDelete(query);
      
      // Remove deviceId from all users' devices array
      await User.updateMany(
        { devices: device.deviceId },
        { $pull: { devices: device.deviceId } }
      );

      return deletedDevice;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = deviceService; 