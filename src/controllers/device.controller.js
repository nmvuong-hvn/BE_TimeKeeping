const deviceService = require('../services/device.service');

const deviceController = {
  getAllDevices: async (req, res) => {
    try {
      const userId = req.user.role === 'admin' ? req.user._id : null;
      const devices = await deviceService.getAllDevices(userId);
      
      return res.status(200).json({
        status: 200,
        message: 'Devices retrieved successfully',
        data: devices
      });
    } catch (error) {
      console.error('Error in getAllDevices:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getDeviceById: async (req, res) => {
    try {
      const { deviceId } = req.params;
      const userId = req.user.role === 'admin' ? req.user._id : null;
      
      const device = await deviceService.getDeviceById(deviceId, userId);
      if (!device) {
        return res.status(404).json({
          status: 404,
          message: 'Device not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Device retrieved successfully',
        data: device
      });
    } catch (error) {
      console.error('Error in getDeviceById:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  createDevice: async (req, res) => {
    try {
      const deviceData = { deviceId : req.body.code , name : req.body.name, userId: req.user._id };
      console.log("deviceData = ", deviceData);
      const newDevice = await deviceService.createDevice(deviceData);
      
      return res.status(201).json({
        status: 201,
        message: 'Device created successfully',
        data: newDevice
      });
    } catch (error) {
      console.error('Error in createDevice:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  updateDevice: async (req, res) => {
    try {
    

      const { id } = req.params;
      const updateData = req.body;
      updateData.deviceId = id ;
      const userId = req.user.role === 'admin' ? req.user._id : null;
      
      // Prevent userId from being updated via request body
      if (updateData.userId) {
        delete updateData.userId;
      }
      
      const updatedDevice = await deviceService.updateDevice(id, updateData, userId);
      if (!updatedDevice) {
        return res.status(404).json({
          status: 404,
          message: 'Device not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Device updated successfully',
        data: updatedDevice
      });
    } catch (error) {
      console.error('Error in updateDevice:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  deleteDevice: async (req, res) => {
    try {
   

      const { id } = req.params;
      const userId = req.user.role === 'admin' ? req.user._id : null;
      
      const deletedDevice = await deviceService.deleteDevice(id, userId);
      if (!deletedDevice) {
        return res.status(404).json({
          status: 404,
          message: 'Device not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Device deleted successfully',
        data: deletedDevice
      });
    } catch (error) {
      console.error('Error in deleteDevice:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  }
};

module.exports = deviceController;    