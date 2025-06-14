const Department = require('../models/department.model');
const Position = require('../models/position.model');

const departmentService = {
  // Get all departments with the count of positions in each
  getAllDepartments: async (userId = null) => {
    try {
      const matchStage = userId ? { userId: userId } : {};
      
      const departments = await Department.aggregate([
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: 'positions', // The collection name for Position model
            localField: '_id',
            foreignField: 'department',
            as: 'positions'
          }
        },
        {
          $addFields: {
            positionCount: { $size: '$positions' }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            positionCount: 1,
            userId: 1
          }
        }
      ]);
      return departments;
    } catch (error) {
      throw new Error('Could not retrieve departments: ' + error.message);
    }
  },

  // Create a new department
  createDepartment: async (departmentData) => {
    try {
      const newDepartment = new Department(departmentData);
      await newDepartment.save();
      return newDepartment;
    } catch (error) {
      throw new Error('Could not create department: ' + error.message);
    }
  },

  // Update a department
  updateDepartment: async (departmentId, updateData, userId = null) => {
    try {
      const query = { _id: departmentId };
      if (userId) {
        query.userId = userId;
      }
      const updatedDepartment = await Department.findOneAndUpdate(query, updateData, { new: true });
      return updatedDepartment;
    } catch (error) {
      throw new Error('Could not update department: ' + error.message);
    }
  },

  // Delete a department (and remove associated positions)
  deleteDepartment: async (departmentId, userId = null) => {
    try {
      const query = { _id: departmentId };
      if (userId) {
        query.userId = userId;
      }
      
      // Remove positions associated with the department
      await Position.deleteMany({ department: departmentId });

      // Delete the department
      const deletedDepartment = await Department.findOneAndDelete(query);
      return deletedDepartment;
    } catch (error) {
      throw new Error('Could not delete department: ' + error.message);
    }
  },

  // Get a department by ID
  getDepartmentById: async (departmentId, userId = null) => {
    try {
      const query = { _id: departmentId };
      if (userId) {
        query.userId = userId;
      }
      const department = await Department.findOne(query);
      return department; // Returns department document or null if not found
    } catch (error) {
      throw new Error('Could not retrieve department: ' + error.message);
    }
  },

  getDepartmentByName: async (name, userId = null) => {
    try {
      const query = { name: name };
      if (userId) {
        query.userId = userId;
      }
      const department = await Department.findOne(query);
      return department;
    } catch (error) {
      console.error('Error in getDepartmentByName:', error);
      throw error;
    }
  }
};

module.exports = departmentService; 