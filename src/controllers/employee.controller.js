const e = require('express');
const employeeService = require('../services/employee.service');
const fs = require('fs');
const path = require('path');
const Employee = require('../models/employee.model');
const { displayEmployeeImages } = require('../utils/imageUtils');
const { calculateAge } = require('../utils/date.utils');
const User = require('../models/user.model');

const employeeController = {
  registerEmployee: async (req, res) => {
    console.log("req.body = ", req.body);
    try {
      const employeeData = req.body;
      console.log("employeeData = ", employeeData);
      // Validate required fields
      if (!employeeData.employeeId || !employeeData.fullName || !employeeData.email || !employeeData.phone) {
        return res.status(400).json({
          status: 400,
          message: 'Missing required fields: employeeId, fullName, email, and phone are required.',
          data: null
        });
      }

      // Validate email format
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(employeeData.email)) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid email format',
          data: null
        });
      }

      // Validate phone format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(employeeData.phone)) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid phone format. Must be 10 digits.',
          data: null
        });
      }

      // Check if employee already exists
      const existingEmployee = await employeeService.getEmployeeByEmployeeId(employeeData.employeeId);
      if (existingEmployee) {
        return res.status(409).json({
          status: 409,
          message: 'Employee with this ID already exists',
          data: null
        });
      }

      // Create new employee
      const newEmployee = await employeeService.createEmployee(employeeData);
      return res.status(201).json({
        status: 201,
        message: 'Employee registered successfully',
        data: newEmployee
      });
    } catch (error) {
      console.error('Error in registerEmployee:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  updateEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const updateData = req.body;

      let filter = { employeeId: employeeId };

      if (req.user.role === 'admin') {
        // Admin can only update employees linked to their devices or created by them
        const employeeToUpdate = await employeeService.getEmployeeByEmployeeId(employeeId);

        if (!employeeToUpdate) {
          return res.status(404).json({
            status: 404,
            message: 'Employee not found',
            data: null
          });
        }

        const isAllowedByDevice = req.user.devices.includes(employeeToUpdate.deviceId);
        const isCreatedByAdmin = employeeToUpdate.userId && employeeToUpdate.userId.toString() === req.user._id.toString();

        if (!isAllowedByDevice && !isCreatedByAdmin) {
          return res.status(403).json({
            status: 403,
            message: 'Forbidden: You do not have permission to update this employee.',
            data: null
          });
        }
        // Add userId to updateData if admin is creating/updating, but only if it's not already set to another user
        if (!employeeToUpdate.userId) {
            updateData.userId = req.user._id;
        }

      }
      // Superadmin has full access, no additional filter needed based on role

      const updatedEmployee = await employeeService.updateEmployee(filter, updateData);

      if (!updatedEmployee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee updated successfully',
        data: updatedEmployee
      });
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  deleteEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      let filter = { employeeId: employeeId };

      if (req.user.role === 'admin') {
        const employeeToDelete = await employeeService.getEmployeeByEmployeeId(employeeId);
        if (!employeeToDelete) {
          return res.status(404).json({
            status: 404,
            message: 'Employee not found',
            data: null
          });
        }
        const isAllowedByDevice = req.user.devices.includes(employeeToDelete.deviceId);
        const isCreatedByAdmin = employeeToDelete.userId && employeeToDelete.userId.toString() === req.user._id.toString();

        if (!isAllowedByDevice && !isCreatedByAdmin) {
          return res.status(403).json({
            status: 403,
            message: 'Forbidden: You do not have permission to delete this employee.',
            data: null
          });
        }
      }

      const deletedEmployee = await employeeService.deleteEmployee(filter);
      
      if (!deletedEmployee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee deleted successfully',
        data: deletedEmployee
      });
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getAllEmployees: async (req, res) => {
    try {
      let filter = {};
      console.log("req.user.role = ", req.user);
      if (req.user.role === 'admin') {
        if (req.query.deviceId) {
          // If deviceId is provided in query, filter by that specific deviceId
          if (!req.user.devices.includes(req.query.deviceId)) {
            return res.status(403).json({
              status: 403,
              message: 'Forbidden: You do not have access to this deviceId.',
              data: null
            });
          }
          filter.deviceId = req.query.deviceId;
        } else {
          // If no deviceId in query, filter by all devices assigned to the admin
          filter.deviceId = { $in: req.user.devices };
        }
      }
      // Superadmin does not need deviceId filtering, so filter remains empty

      const employees = await employeeService.getAllEmployees(filter);
      return res.status(200).json({
        status: 200,
        message: 'Employees retrieved successfully',
        data: employees
      });
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getEmployeeById: async (req, res) => {
    try {
      const { employeeId } = req.params;
      console.log("employeeId = ", employeeId);
      const employee = await employeeService.getEmployeeByEmployeeId(employeeId);
      console.log("employee = ", employee);
      if (!employee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee retrieved successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error in getEmployeeById:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  // Hàm xử lý dữ liệu sự kiện từ thiết bị (tái sử dụng bởi worker và HTTP)
  processDeviceEventData: async (eventData) => {
    if (!eventData.deviceId || !eventData.employeeName || !eventData.employeeId ) {
      return {
        status: 400,
        message: 'Missing required fields.',
        data: null
      };
    }

    const { deviceId, employeeName, employeeId,department,position,timestamp, status, faceBase64 } = eventData;
    return {
      status: 200,
      data: {deviceId, employeeName, employeeId,department,position,timestamp, status, faceBase64 },
      message: 'Data processed successfully'
    };
  },

  handleCheckinSave: async (processedData) => {
    try {
      const faceIdForCheckin = processedData.faceBase64 || 'N/A';

      const [date, time] = processedData.data.timestamp.split(" ");
      const [year, month, day] = date.split("-").map(Number);
      const [hours, minutes, seconds] = time.split(":").map(Number);
      const timestampData =  new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

      console.log("timestampData = ", timestampData);

      // Authorization for admin users coming from MQTT (for check-in)
      if (processedData.userId) { // userId is passed from mqtt.service if an admin manages the device
          const managingUser = await User.findById(processedData.userId);

          if (managingUser && managingUser.role === 'admin') {
              const employeeCheckingIn = await employeeService.getEmployeeByEmployeeIdString(processedData.data.employeeId);
              if (employeeCheckingIn.data) {
                  const isAllowedByDevice = employeeCheckingIn.data.deviceId && managingUser.devices.includes(employeeCheckingIn.data.deviceId);
                  if (!isAllowedByDevice) {
                      console.warn(`MQTT Check-in: Admin user ${managingUser.username} does not have access to deviceId: ${employeeCheckingIn.data.deviceId}. Check-in ignored.`);
                      return { status: 403, message: 'Forbidden: Admin does not have permission to check-in via this device.' };
                  }
              } else {
                  console.warn(`MQTT Check-in: Employee ${processedData.data.employeeId} not found for authorization check. Proceeding with check-in without specific employee device auth.`);
              }
          }
      }

      const checkinRecord = await employeeService.recordCheckin(
        processedData.data.deviceId,
        processedData.data.employeeId,
        timestampData,
        faceIdForCheckin,
        processedData.data.status || "checkin",
        processedData.userId // Pass userId to service for context or future use
      );
      console.log('Check-in record created:', checkinRecord);
      return {
        status: 201,
        data: checkinRecord,
        message: 'Check-in record created successfully'
      };
    } catch (error) {
      console.error('Error saving check-in record:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  handleRegistrationSave: async (registrationData) => {
    try {
      // Validate dữ liệu đăng ký
      console.log("registrationData = ", registrationData);
      if (!registrationData.employeeId || !registrationData.employeeName) {
        return {
          status: 400,
          message: 'Missing required fields: employeeId and employeeName are required',
          data: null
        };
      }

      // Kiểm tra nhân viên đã tồn tại
      const existingEmployee = await employeeService.getEmployeeByEmployeeIdString(registrationData.employeeId);
      if (existingEmployee.data) {
        return {
          status: 409,
          message: 'Employee already exists',
          data: null
        };
      }

      // Tạo nhân viên mới
      const newEmployee = await employeeService.createEmployee({
        employeeId: registrationData.employeeId,
        fullName: registrationData.employeeName,
        department: registrationData.department ,
        position: registrationData.position ,
        shift: registrationData.shift,
        registrationDate: registrationData.registrationDate,
        faceImage: registrationData.faceBase64,
        imageAvatar: registrationData.faceEmbedding,
        userId: registrationData.userId // Assign userId from MQTT message if available
      });

      console.log('New employee registered:', newEmployee);
      return {
        status: 201,
        data: newEmployee,
        message: 'Employee registered successfully'
      };
    } catch (error) {
      console.error('Error in handleRegistrationSave:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  handleUpdateSave: async (updateData) => {
    try {
      // Validate dữ liệu cập nhật
      if (!updateData.employeeId) {
        return {
          status: 400,
          message: 'Missing required field: employeeId',
          data: null
        };
      }

      // Tìm nhân viên cần cập nhật
      const existingEmployee = await employeeService.getEmployeeByEmployeeIdString(updateData.employeeId);
      if (!existingEmployee.data) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      // Authorization for admin users coming from MQTT
      if (updateData.userId) { // userId is passed from mqtt.service if an admin manages the device
          const managingUser = await User.findById(updateData.userId);

          if (managingUser && managingUser.role === 'admin') {
              const isAllowedByDevice = existingEmployee.data.deviceId && managingUser.devices.includes(existingEmployee.data.deviceId);
              const isCreatedByAdmin = existingEmployee.data.userId && existingEmployee.data.userId.toString() === managingUser._id.toString();

              if (!isAllowedByDevice && !isCreatedByAdmin) {
                  return {
                      status: 403,
                      message: 'Forbidden: Admin does not have permission to update this employee via MQTT.',
                      data: null
                  };
              }
          }
      }

      // Cập nhật thông tin
      const updatedEmployee = await employeeService.updateEmployee(
        { employeeId: updateData.employeeId }, // Filter
        {
          fullName: updateData.fullName,
          faceImage: updateData.faceBase64,
          imageAvatar: updateData.faceEmbedding
          // Do not include userId here if it's the creator's ID
          // Add other fields here if they are expected to be updated via MQTT and are in updateData
        }
      );

      console.log('Employee updated:', updatedEmployee);
      return {
        status: 200,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      };
    } catch (error) {
      console.error('Error in handleUpdateSave:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  getLateEmployees: async (req, res) => {
    try {
      const { date, departmentId, deviceId } = req.query;
      let filter = {};

      if (req.user.role === 'admin') {
        if (deviceId) {
          if (!req.user.devices.includes(deviceId)) {
            return res.status(403).json({
              status: 403,
              message: 'Forbidden: You do not have access to this deviceId.',
              data: null
            });
          }
          filter.deviceId = deviceId;
        } else {
          filter.deviceId = { $in: req.user.devices };
        }
      }
      // Superadmin does not need deviceId filtering

      if (departmentId) {
        filter.department = departmentId;
      }

      // Convert date to GMT+7
      let targetDate = date ? new Date(date) : new Date();

      const result = await employeeService.getLateEmployees(targetDate, filter);
      res.status(result.status).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error getting late employees: ' + error.message,
        data: null
      });
    }
  },

  getEarlyLeaveEmployees: async (req, res) => {
    try {
      const { date, departmentId, deviceId } = req.query;
      let filter = {};

      if (req.user.role === 'admin') {
        if (deviceId) {
          if (!req.user.devices.includes(deviceId)) {
            return res.status(403).json({
              status: 403,
              message: 'Forbidden: You do not have access to this deviceId.',
              data: null
            });
          }
          filter.deviceId = deviceId;
        } else {
          filter.deviceId = { $in: req.user.devices };
        }
      }
      // Superadmin does not need deviceId filtering

      if (departmentId) {
        filter.department = departmentId;
      }
      
      // Convert date to GMT+7
      let targetDate = date ? new Date(date) : new Date();
      console.log("targetDateNow: ", targetDate);
      
      const result = await employeeService.getEarlyLeaveEmployees(targetDate, filter);
      res.status(result.status).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error getting early leave employees: ' + error.message,
        data: null
      });
    }
  },

  getOvertimeEmployees: async (req, res) => {
    try {
      const { date, departmentId, deviceId } = req.query;
      let filter = {};

      if (req.user.role === 'admin') {
        if (deviceId) {
          if (!req.user.devices.includes(deviceId)) {
            return res.status(403).json({
              status: 403,
              message: 'Forbidden: You do not have access to this deviceId.',
              data: null
            });
          }
          filter.deviceId = deviceId;
        } else {
          filter.deviceId = { $in: req.user.devices };
        }
      }
      // Superadmin does not need deviceId filtering

      if (departmentId) {
        filter.department = departmentId;
      }

      let targetDate = date ? new Date(date) : new Date();
      const result = await employeeService.getOvertimeEmployees(targetDate, filter);
      res.status(result.status).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error getting overtime employees: ' + error.message,
        data: null
      });
    }
  },

  createTestCheckin: async (req, res) => {
    try {
      const { employeeId, checkinStatus, timestamp } = req.body;
      
      if (!employeeId || !checkinStatus) {
        return res.status(400).json({
          status: 400,
          message: 'Employee ID and check-in status are required',
          data: null
        });
      }

      const result = await employeeService.createTestCheckin(employeeId, checkinStatus, timestamp);
      res.status(result.status).json(result);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Error creating test check-in: ' + error.message,
        data: null
      });
    }
  },

  updateEmployeeAvatar: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { imageAvatar } = req.body;

      if (!imageAvatar) {
        return res.status(400).json({
          status: 400,
          message: 'Image avatar is required',
          data: null
        });
      }

      // Validate base64 image format
      if (!imageAvatar.startsWith('data:image/')) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid image format. Must be base64 encoded image',
          data: null
        });
      }

      const updatedEmployee = await employeeService.updateEmployeeAvatar(employeeId, imageAvatar);
      
      if (!updatedEmployee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee avatar updated successfully',
        data: updatedEmployee
      });
    } catch (error) {
      console.error('Error in updateEmployeeAvatar:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getEmployeesByDepartmentAndDate: async (req, res) => {
    try {
      const { departmentId, date } = req.query;

      // Validate date format if provided
      let targetDate = new Date();
      if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({
            status: 400,
            message: 'Invalid date format. Please use YYYY-MM-DD format',
            data: null
          });
        }
      }

      // Set start date to 01/01/1977
      const startDate = new Date('1977-01-01');

      const result = await employeeService.getEmployeesByDepartmentAndDate(departmentId, startDate, targetDate);
      
      return res.status(200).json({
        status: 200,
        message: 'Employees retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in getEmployeesByDepartmentAndDate:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getMonthlyStatistics: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { year, month } = req.query;

      // Validate year and month
      if (!year || !month) {
        return res.status(400).json({
          status: 400,
          message: 'Year and month are required',
          data: null
        });
      }

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid year or month',
          data: null
        });
      }

      const result = await employeeService.getMonthlyStatistics(employeeId, yearNum, monthNum);
      return res.status(result.status).json(result);
    } catch (error) {
      console.error('Error in getMonthlyStatistics:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getEmployeeImages: async (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const employee = await Employee.findOne({ employeeId });

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Decode and save images
      const imagePaths = displayEmployeeImages(employee);

      res.json({
        message: 'Images processed successfully',
        imagePaths
      });
    } catch (error) {
      console.error('Error processing employee images:', error);
      res.status(500).json({ message: 'Error processing images', error: error.message });
    }
  },

  createEmployee: async (req, res) => {
    try {
      const { employeeId, fullName, email, phone, department, position, shift, faceImage, imageAvatar, image34, status, deviceId } = req.body;

      // Validate required fields for HTTP creation
      if (!employeeId || !fullName || !deviceId) {
        return res.status(400).json({
          status: 400,
          message: 'Missing required fields: employeeId, fullName, and deviceId are required.',
          data: null
        });
      }

      // Check if employee already exists
      const existingEmployee = await employeeService.getEmployeeByEmployeeIdString(employeeId);
      if (existingEmployee.data) {
        return res.status(409).json({
          status: 409,
          message: 'Employee with this ID already exists.',
          data: null
        });
      }

      // Prepare employee data
      const employeeData = {
        employeeId,
        fullName,
        email,
        phone,
        department,
        position,
        shift,
        faceImage,
        imageAvatar,
        image34,
        status,
        deviceId,
        userId: req.user._id // Assign the creator's userId
      };

      // For admin, deviceAccess middleware already verified deviceId, so just proceed
      // Superadmin has full access

      const newEmployee = await employeeService.createEmployee(employeeData);

      return res.status(201).json({
        status: 201,
        message: 'Employee created successfully',
        data: newEmployee
      });
    } catch (error) {
      console.error('Error in createEmployee (HTTP):', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  }
};

module.exports = employeeController; 