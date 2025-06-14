const Position = require('../models/position.model');

const positionService = {
  getPositionByName: async (name, department) => {
    try {
      const position = await Position.findOne({ 
        name: name,
        department : department
      });
      return position;
    } catch (error) {
      console.error('Error in getPositionByName:', error);
      throw error;
    }
  },

  getAllPositions: async () => {
    try {
      const positions = await Position.find({}).populate('department', 'name'); // Populate 'department' field, only select 'name'
      return positions;
    } catch (error) {
      console.error('Error in getAllPositions:', error);
      throw error;
    }
  },

  getPositionsByDepartment: async (departmentId) => {
    try {
      const positions = await Position.find({ department: departmentId }).populate('department', 'name');
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

  updatePosition: async (positionId, updateData) => {
    try {
      console.log("updateData = ", updateData);
      const allowedUpdates = ['name', 'updatedAt', 'createdAt'];
      const updates = Object.keys(updateData);
      const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

      if (!isValidOperation) {
          throw new Error('Invalid updates!');
      }

      const updatedPosition = await Position.findByIdAndUpdate(positionId, { name: updateData.name }, { new: true });
      return updatedPosition;
    } catch (error) {
      console.error('Error in updatePosition:', error);
      throw error;
    }
  },

  deletePosition: async (positionId) => {
    try {
      const deletedPosition = await Position.findByIdAndDelete(positionId);
      return deletedPosition;
    } catch (error) {
      console.error('Error in deletePosition:', error);
      throw error;
    }
  }
};

module.exports = positionService; 