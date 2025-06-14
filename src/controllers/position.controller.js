const positionService = require('../services/position.service');
const mongoose = require('mongoose'); 
const departmentService = require('../services/department.service'); 

const positionController = {
  createPosition: async (req, res) => {
    try {
      const positionData = req.body;
      console.log(JSON.stringify(positionData));
      if (!positionData.name) {
        return res.status(400).json({
          status: 400,
          message: 'Position name is required',
          data: null
        });
      }

      // Validate data types
      if (typeof positionData.name !== 'string') {
        return res.status(400).json({
          status: 400,
          message: 'Position name must be a string',
          data: null
        });
      }

      let departmentId = null;
      
      // Handle department ID if provided directly
      if (positionData.department) {
        departmentId = positionData.department;
        // Validate if department exists
        const department = await departmentService.getDepartmentById(departmentId, req.user.role === 'admin' ? req.user._id : null);
        if (!department) {
          return res.status(404).json({
            status: 404,
            message: `Department with ID "${departmentId}" not found`,
            data: null
          });
        }
      }
      // Handle department name if provided
      else if (positionData.departmentName) {
        const department = await departmentService.getDepartmentByName(positionData.departmentName, req.user.role === 'admin' ? req.user._id : null);
        if (!department) {
          return res.status(404).json({
            status: 404,
            message: `Department with name "${positionData.departmentName}" not found`,
            data: null
          });
        }
        departmentId = department._id;
      }
      // If neither department nor departmentName is provided
      else {
        return res.status(400).json({
          status: 400,
          message: 'Either department ID or department name is required',
          data: null
        });
      }

      const existingPosition = await positionService.getPositionByName(positionData.name, departmentId, req.user.role === 'admin' ? req.user._id : null);
      if (existingPosition) {
        return res.status(409).json({
          status: 409,
          message: 'Position with this name already exists',
          data: null
        });
      }

      // Create new position
      const newPosition = await positionService.createPosition({
        name: positionData.name,
        department: departmentId,
        userId: req.user._id
      });

      return res.status(201).json({
        status: 201,
        message: 'Position created successfully',
        data: newPosition
      });

    } catch (error) {
      console.error('Error in createPosition:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getAllPositions: async (req, res) => {
    try {
      const userId = req.user.role === 'admin' ? req.user._id : null;
      const positions = await positionService.getAllPositions(userId);
      return res.status(200).json({
        status: 200,
        message: 'Positions retrieved successfully',
        data: positions
      });
    } catch (error) {
      console.error('Error in getAllPositions:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getPositionsByDepartment: async (req, res) => {
    try {
      const { departmentId } = req.params;
      const userId = req.user.role === 'admin' ? req.user._id : null;
      
      if (!departmentId) {
        return res.status(400).json({
          status: 400,
          message: 'Department ID is required',
          data: null
        });
      }

      const positions = await positionService.getPositionsByDepartment(departmentId, userId);
      return res.status(200).json({
        status: 200,
        message: 'Positions retrieved successfully',
        data: positions
      });
    } catch (error) {
      console.error('Error in getPositionsByDepartment:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  updatePosition: async (req, res) => {
    try {
      const { positionId } = req.params;
      const updateData = req.body;
      const userId = req.user.role === 'admin' ? req.user._id : null;
      
      // Prevent userId from being updated via request body
      if (updateData.userId) {
        delete updateData.userId;
      }

      if (!positionId) {
        return res.status(400).json({
          status: 400,
          message: 'Position ID is required',
          data: null
        });
      }

      // Validate data types
      if (updateData.name && typeof updateData.name !== 'string') {
        return res.status(400).json({
          status: 400,
          message: 'Position name must be a string',
          data: null
        });
      }

      if (updateData.description && typeof updateData.description !== 'string') {
        return res.status(400).json({
          status: 400,
          message: 'Position description must be a string',
          data: null
        });
      }

      const updatedPosition = await positionService.updatePosition(positionId, {
        ...updateData,
        updatedAt: new Date()
      }, userId);

      if (!updatedPosition) {
        return res.status(404).json({
          status: 404,
          message: 'Position not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Position updated successfully',
        data: updatedPosition
      });
    } catch (error) {
      console.error('Error in updatePosition:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  deletePosition: async (req, res) => {
    try {
      const { positionId } = req.params;
      const userId = req.user.role === 'admin' ? req.user._id : null;

      if (!positionId) {
        return res.status(400).json({
          status: 400,
          message: 'Position ID is required',
          data: null
        });
      }

      const deletedPosition = await positionService.deletePosition(positionId, userId);

      if (!deletedPosition) {
        return res.status(404).json({
          status: 404,
          message: 'Position not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Position deleted successfully',
        data: deletedPosition
      });
    } catch (error) {
      console.error('Error in deletePosition:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  }
};

module.exports = positionController; 