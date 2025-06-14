const departmentService = require('../services/department.service');

const departmentController = {
  getDepartmentByName: async (req, res) => {
    try {
      const { name } = req.params;
      
      if (!name) {
        return res.status(400).json({
          status: 400,
          message: 'Department name is required',
          data: null
        });
      }

      const department = await departmentService.getDepartmentByName(name);
      
      if (!department) {
        return res.status(404).json({
          status: 404,
          message: `Department with name "${name}" not found`,
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Department found successfully',
        data: department
      });
    } catch (error) {
      console.error('Error in getDepartmentByName:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getAllDepartments: async (req, res) => {
    try {
      const departments = await departmentService.getAllDepartments();
      return res.status(200).json({
        status: 200,
        message: 'Departments retrieved successfully',
        data: departments
      });
    } catch (error) {
      console.error('Error in departmentController.getAllDepartments:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  createDepartment: async (req, res) => {
    try {
      const departmentData = { ...req.body, userId: req.user._id };
      console.log("departmentData = ", departmentData);
      
      const newDepartment = await departmentService.createDepartment(departmentData);
      return res.status(201).json({
        status: 201,
        message: 'Department created successfully',
        data: newDepartment
      });
    } catch (error) {
      console.error('Error in departmentController.createDepartment:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  updateDepartment: async (req, res) => {
    try {
      const departmentId = req.params.departmentId;
      const updateData = req.body;
      // Prevent userId from being updated via request body
      if (updateData.userId) {
        delete updateData.userId;
      }
      const updatedDepartment = await departmentService.updateDepartment(departmentId, updateData);
      if (!updatedDepartment) {
        return res.status(404).json({
          status: 404,
          message: 'Department not found',
          data: null
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Department updated successfully',
        data: updatedDepartment
      });
    } catch (error) {
      console.error('Error in departmentController.updateDepartment:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  deleteDepartment: async (req, res) => {
    try {
      const departmentId = req.params.departmentId;
      const deletedDepartment = await departmentService.deleteDepartment(departmentId);
      if (!deletedDepartment) {
        return res.status(404).json({
          status: 404,
          message: 'Department not found',
          data: null
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Department deleted successfully',
        data: deletedDepartment
      });
    } catch (error) {
      console.error('Error in departmentController.deleteDepartment:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  }
};

module.exports = departmentController; 