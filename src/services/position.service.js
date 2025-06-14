const Position = require('../models/position.model');

const positionService = {
  getPositionByName: async (name, department, userId = null) => {
    try {
      const query = { 
        name: name,
        department: department
      };
      if (userId) {
        query.userId = userId;
      }
      const position = await Position.findOne(query);
      return position;
    } catch (error) {
      console.error('Error in getPositionByName:', error);
      throw error;
    }
  },

  getAllPositions: async (userId = null) => {
    try {
      const query = {};
      if (userId) {
        query.userId = userId;
      }
      const positions = await Position.find(query).populate('department', 'name'); // Populate 'department' field, only select 'name'
      return positions;
    } catch (error) {
      console.error('Error in getAllPositions:', error);
      throw error;
    }
  },

  getPositionsByDepartment: async (departmentId, userId = null) => {
    try {
      const query = { department: departmentId };
      if (userId) {
        query.userId = userId;
      }
      const positions = await Position.find(query).populate('department', 'name');
      return positions;
    } catch (error) {
      console.error('Error in getPositionsByDepartment:', error);
      throw error;
    }
  },

  createPosition: async (positionData) => {
    try {
      const newPosition = new Position(positionData);
      await newPosition.save();
      return newPosition;
    } catch (error) {
      console.error('Error in createPosition:', error);
      throw error;
    }
  },

  updatePosition: async (positionId, updateData, userId = null) => {
    try {
      console.log("updateData = ", updateData);
      const allowedUpdates = ['name', 'updatedAt', 'createdAt'];
      const updates = Object.keys(updateData);
      const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

      if (!isValidOperation) {
          throw new Error('Invalid updates!');
      }

      const query = { _id: positionId };
      if (userId) {
        query.userId = userId;
      }
      const updatedPosition = await Position.findOneAndUpdate(query, { name: updateData.name }, { new: true });
      return updatedPosition;
    } catch (error) {
      console.error('Error in updatePosition:', error);
      throw error;
    }
  },

  deletePosition: async (positionId, userId = null) => {
    try {
      const query = { _id: positionId };
      if (userId) {
        query.userId = userId;
      }
      const deletedPosition = await Position.findOneAndDelete(query);
      return deletedPosition;
    } catch (error) {
      console.error('Error in deletePosition:', error);
      throw error;
    }
  }
};

module.exports = positionService; 