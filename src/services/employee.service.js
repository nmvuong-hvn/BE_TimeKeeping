const Employee = require('../models/employee.model');
const Checkin = require('../models/checkin.model');
const Department = require('../models/department.model');
const Position = require('../models/position.model');
const { formatDateCustom, formatMinutesToHoursAndMinutes, calculateAverageTime } = require('../utils/date.utils');

const employeeService = {
  getEmployeeByEmployeeId: async (employeeId) => {
    try {
      const employee = await Employee.findOne({ employeeId })
        .populate('department', 'name')
        .populate('position', 'name');
      return employee;
    } catch (error) {
      console.error('Error in getEmployeeByEmployeeId:', error);
      throw error;
    }
  },

  getAllEmployees: async (filter = {}) => {
    try {
      const employees = await Employee.find(filter)
        .populate('department', 'name')
        .populate('position', 'name');
      return employees;
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      throw error;
    }
  },

  createEmployee: async (employeeData) => {
    try {
      const newEmployee = new Employee(employeeData);
      await newEmployee.save();
      return newEmployee.populate([
        { path: 'department', select: 'name' },
        { path: 'position', select: 'name' }
      ]);
    } catch (error) {
      console.error('Error in createEmployee:', error);
      throw error;
    }
  },

  updateEmployee: async (employeeId, updateData) => {
    try {
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId },
        updateData,
        { new: true }
      ).populate([
        { path: 'department', select: 'name' },
        { path: 'position', select: 'name' }
      ]);
      return updatedEmployee;
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      throw error;
    }
  },

  deleteEmployee: async (employeeId) => {
    try {
      const deletedEmployee = await Employee.findOneAndDelete({ employeeId });
      return deletedEmployee;
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      throw error;
    }
  },

  recordCheckin: async (deviceID, employeeIdString, timestamp, faceId, checkinStatus) => {
    try {
      const employee = await Employee.findOne({ employeeId: employeeIdString })
        .populate('department', 'name')
        .populate('position', 'name');
      console.log("deviceID = ", deviceID);
      console.log("employeeIdString = ", employeeIdString);
      console.log("timestamp = ", timestamp);
      console.log("faceId = ", faceId);
      console.log("checkinStatus = ", checkinStatus);
      const newCheckin = new Checkin({
        deviceId: deviceID,
        employeeId: employeeIdString,
        timestamp: new Date(timestamp),
        faceId: faceId,
        checkinStatus: checkinStatus
      });
      await newCheckin.save();

      return {
        status: 201,
        message: 'Check-in recorded successfully',
        data: newCheckin
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not record check-in: ' + error.message,
        data: null
      };
    }
  },

  getEmployeeByEmployeeIdString: async (employeeIdString) => {
    try {
      const employee = await Employee.findOne({ employeeId: employeeIdString })
        .populate('department', 'name')
        .populate('position', 'name');
      console.log("employee = ", employee);

      if (!employee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      return {
        status: 200,
        message: 'Employee retrieved successfully',
        data: employee
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not retrieve employee: ' + error.message,
        data: null
      };
    }
  },

  getLateEmployees: async (targetDate, filter = {}) => {
    try {
      // Create date in UTC
      const utcDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate()
      ));

      console.log("Input targetDate: ", targetDate);
      console.log("Input targetDate Local: ", targetDate.getDate());
      console.log("Created UTC Date: ", utcDate);

      // Set start and end of the day in UTC
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));

      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      console.log("startOfDay: ", startOfDay);
      console.log("endOfDay: ", endOfDay);

      // Set start and end of the month in UTC
      const startOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        1,
        0, 0, 0, 0
      ));

      const endOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth() + 1,
        0,
        23, 59, 59, 999
      ));

      // Define early leave times for different shifts in UTC
      const morningShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        8, 0, 0, 0
      )); // 12:00 GMT+7

      const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        13, 0, 0, 0
      )); // 17:00 GMT+7

      const fullDayEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        8, 0, 0, 0
      )); // 17:00 GMT+7

      console.log("fullDayEarlyLeaveTime: ", fullDayEarlyLeaveTime);
      console.log("morningShiftEarlyLeaveTime: ", morningShiftEarlyLeaveTime);
      console.log("afternoonShiftEarlyLeaveTime: ", afternoonShiftEarlyLeaveTime);

      // Build employee query based on provided filter
      let employeeQuery = {};
      if (filter.department) {
        employeeQuery.department = filter.department;
      }
      if (filter.deviceId) {
        employeeQuery.deviceId = filter.deviceId;
      }

      let employees = await Employee.find(employeeQuery)
        .populate('department', 'name')
        .populate('position', 'name');
      
      console.log("Total employees found:", employees.length);

      // Get all check-ins for the specified day
      const employeeIds = employees.map(emp => emp.employeeId);
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));
      console.log("Employee IDs to search:", employeeIds);

      let checkinQuery = {
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      };

      // If a single deviceId is specified in the filter, add it to the checkin query
      if (filter.deviceId && typeof filter.deviceId === 'string') {
        checkinQuery.deviceId = filter.deviceId;
      } else if (filter.deviceId && filter.deviceId.$in) {
        // If deviceId is an $in array, add it to the checkin query
        checkinQuery.deviceId = { $in: filter.deviceId.$in };
      }

      const allCheckins = await Checkin.find(checkinQuery).sort({ timestamp: 1 });

      console.log("allCheckins = ", allCheckins.length);
      const mapCountLate = new Map();
      const mapEmployeeCheckinsLate = new Map();

      allCheckins.forEach(checkin => {
        console.log("timestamp = ", checkin.timestamp);
        const date = formatDateCustom(checkin.timestamp)
        const key = `${checkin.employeeId}_${date}`;
        if (!mapEmployeeCheckinsLate.has(key)) {
          console.log("key = ", key);
          mapEmployeeCheckinsLate.set(key, []);
        }
        mapEmployeeCheckinsLate.get(key).push(checkin);
      });
      console.log("mapEmployeeCheckinsLate = ", mapEmployeeCheckinsLate);

      mapEmployeeCheckinsLate.forEach((checkins, key) => {
        const employeeId = key.split('_')[0];
        const date = key.split('_')[1];
        console.log("checkins = ", checkins.length);
        console.log("date = ", date);

        if (checkins.length > 1 || (checkins.length === 1 && date === formatDateCustom(new Date()))) {
          const checkinTime = checkins[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          console.log("shift = ", shift, " employeeId = ", employeeId);

          const morningLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )); // 12:00 GMT+7

          const afternoonLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            13, 0, 0, 0
          )); // 17:00 GMT+7

          const fullLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )); // 17:00 GMT+7
          if (shift === 'Cả ngày') {
            if (checkinTime > fullLateTime) {
              mapCountLate.set(employeeId, (mapCountLate.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningLateTime) {
              mapCountLate.set(employeeId, (mapCountLate.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonLateTime) {
              mapCountLate.set(employeeId, (mapCountLate.get(employeeId) || 0) + 1);
            }
          }
        }

      });
      console.log("mapCountLate: ", mapCountLate);

      const mapEmployeeLateToday = new Map();
      // muộn hôm nay
      employeeIds.forEach(employeeId => {
        const key = `${employeeId}_${formatDateCustom(targetDate)}`;
        console.log("key = ", key, "mapEmployeeCheckinsLate = ", mapEmployeeCheckinsLate.get(key));
        if (mapEmployeeCheckinsLate.has(key)) {
          const checkinsList = mapEmployeeCheckinsLate.get(key);
          const checkinTime = checkinsList[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          let isLate = false;
          let tmpCheckIn = null;
          console.log("checkinTime: ", checkinTime, "shift: ", shift, "startOfDay: ", startOfDay, "endOfDay: ", endOfDay);
          tmpCheckIn = checkinsList[0];
          if (shift === 'Cả ngày') {
            if (checkinTime > fullDayEarlyLeaveTime) {
              isLate = true;
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningShiftEarlyLeaveTime) {
              isLate = true;
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonShiftEarlyLeaveTime) {
              isLate = true;
            }
          }
          if (isLate) {
            mapEmployeeLateToday.set(employeeId, tmpCheckIn);
          }
        }
      });
      console.log("mapEmployeeLateToday: ", mapEmployeeLateToday);

      const employeeLateTodayList = Array.from(mapEmployeeLateToday.values())
        .map(checkin => {
          const employee = employeeMap.get(checkin.employeeId);
          const checkinTime = new Date(checkin.timestamp);
          const timePolicy = employee.shift === 'Cả ngày' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )) : employee.shift === 'Ca sáng' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )) : new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getMonth(),
            checkinTime.getDate(), 13, 0, 0, 0));
          const lateMinutes = Math.round((checkinTime - timePolicy) / (1000 * 60));
          return {
            "Id": employee.employeeId,
            "employeeName": employee.fullName,
            "department": employee.department ? employee.department.name : 'N/A',
            "position": employee.position ? employee.position.name : 'N/A',
            "shift": employee.shift,
            "checkinTime": `${checkinTime.getUTCHours()}:${checkinTime.getUTCMinutes()}`,
            "lateMinutes": `${lateMinutes} phút`,
            "countLate": mapCountLate.get(checkin.employeeId) || 0
          };
        });

      return {
        status: 200,
        message: 'Late employees retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: filter.department && filter.department !== 'all' ? (await Department.findById(filter.department)).name : 'All Departments',
          totalEmployees: employees.length,
          lateEmployees: mapEmployeeLateToday.length,
          employees: employeeLateTodayList
        }
      };
    } catch (error) {
      console.error('Error in getLateEmployees:', error);
      return {
        status: 500,
        message: 'Could not retrieve late employees: ' + error.message,
        data: null
      };
    }
  },

  getEarlyLeaveEmployees: async (targetDate, filter = {}) => {
    try {
      // Create date in UTC
      const utcDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate()
      ));

      // Set start and end of the day in UTC
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));

      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      // Define early leave times for different shifts in UTC
      const morningShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        12, 0, 0, 0
      )); // 12:00 GMT+7

      const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 17:00 GMT+7

      const fullDayEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 17:00 GMT+7

      // Build employee query based on provided filter
      let employeeQuery = {};
      if (filter.department) {
        employeeQuery.department = filter.department;
      }
      if (filter.deviceId) {
        employeeQuery.deviceId = filter.deviceId;
      }

      let employees = await Employee.find(employeeQuery)
        .populate('department', 'name')
        .populate('position', 'name');

      // Get all check-ins for the specified day
      const employeeIds = employees.map(emp => emp.employeeId);
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));

      let checkinQuery = {
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      };
      // If a single deviceId is specified in the filter, add it to the checkin query
      if (filter.deviceId && typeof filter.deviceId === 'string') {
        checkinQuery.deviceId = filter.deviceId;
      } else if (filter.deviceId && filter.deviceId.$in) {
        // If deviceId is an $in array, add it to the checkin query
        checkinQuery.deviceId = { $in: filter.deviceId.$in };
      }

      const allCheckins = await Checkin.find(checkinQuery).sort({ timestamp: 1 });

      const mapEmployeeCheckinsEarly = new Map();

      allCheckins.forEach(checkin => {
        const date = formatDateCustom(checkin.timestamp);
        const key = `${checkin.employeeId}_${date}`;
        if (!mapEmployeeCheckinsEarly.has(key)) {
          mapEmployeeCheckinsEarly.set(key, []);
        }
        mapEmployeeCheckinsEarly.get(key).push(checkin);
      });

      const mapCountEarlyLeave = new Map();

      mapEmployeeCheckinsEarly.forEach((checkins, key) => {
        const employeeId = key.split('_')[0];
        const date = key.split('_')[1];
        // Only consider if there are two check-ins for the day
        if (checkins.length >= 2) {
          const checkinTime = checkins[1].timestamp; // Second check-in is checkout
          const shift = employeeShiftMap.get(employeeId);

          if (shift === 'Cả ngày') {
            if (checkinTime < fullDayEarlyLeaveTime) {
              mapCountEarlyLeave.set(employeeId, (mapCountEarlyLeave.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime < morningShiftEarlyLeaveTime) {
              mapCountEarlyLeave.set(employeeId, (mapCountEarlyLeave.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime < afternoonShiftEarlyLeaveTime) {
              mapCountEarlyLeave.set(employeeId, (mapCountEarlyLeave.get(employeeId) || 0) + 1);
            }
          }
        }
      });

      const mapEmployeeEarlyLeaveToday = new Map();
      employeeIds.forEach(employeeId => {
        const key = `${employeeId}_${formatDateCustom(targetDate)}`;
        if (mapEmployeeCheckinsEarly.has(key)) {
          const checkinsList = mapEmployeeCheckinsEarly.get(key);
          if (checkinsList.length >= 2) {
            const checkinTime = checkinsList[1].timestamp; // Second check-in is checkout
            const shift = employeeShiftMap.get(employeeId);
            let isEarlyLeave = false;
            let tmpCheckIn = null;

            tmpCheckIn = checkinsList[1];

            if (shift === 'Cả ngày') {
              if (checkinTime < fullDayEarlyLeaveTime) {
                isEarlyLeave = true;
              }
            } else if (shift === 'Ca sáng') {
              if (checkinTime < morningShiftEarlyLeaveTime) {
                isEarlyLeave = true;
              }
            } else if (shift === 'Ca chiều') {
              if (checkinTime < afternoonShiftEarlyLeaveTime) {
                isEarlyLeave = true;
              }
            }
            if (isEarlyLeave) {
              mapEmployeeEarlyLeaveToday.set(employeeId, tmpCheckIn);
            }
          }
        }
      });

      const employeeEarlyLeaveTodayList = Array.from(mapEmployeeEarlyLeaveToday.values())
        .map(checkin => {
          const employee = employeeMap.get(checkin.employeeId);
          const checkinTime = new Date(checkin.timestamp);
          const timePolicy = employee.shift === 'Cả ngày' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )) : employee.shift === 'Ca sáng' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            12, 0, 0, 0
          )) : new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0));
          const earlyLeaveMinutes = Math.round((timePolicy - checkinTime) / (1000 * 60));
          return {
            "Id": employee.employeeId,
            "employeeName": employee.fullName,
            "department": employee.department ? employee.department.name : 'N/A',
            "position": employee.position ? employee.position.name : 'N/A',
            "shift": employee.shift,
            "checkoutTime": `${checkinTime.getUTCHours()}:${checkinTime.getUTCMinutes()}`,
            "earlyLeaveMinutes": `${earlyLeaveMinutes} phút`,
            "countEarlyLeave": mapCountEarlyLeave.get(checkin.employeeId) || 0
          };
        });

      return {
        status: 200,
        message: 'Early leave employees retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: filter.department && filter.department !== 'all' ? (await Department.findById(filter.department)).name : 'All Departments',
          totalEmployees: employees.length,
          earlyLeaveEmployees: employeeEarlyLeaveTodayList.length,
          employees: employeeEarlyLeaveTodayList
        }
      };
    } catch (error) {
      console.error('Error in getEarlyLeaveEmployees:', error);
      return {
        status: 500,
        message: 'Could not retrieve early leave employees: ' + error.message,
        data: null
      };
    }
  },

  getOvertimeEmployees: async (targetDate, filter = {}) => {
    try {
      // Create date in UTC
      const utcDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate()
      ));

      // Set start and end of the day in UTC
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));

      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      // Define shift end times for overtime calculation in UTC
      const morningShiftEndTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        12, 0, 0, 0
      )); // 12:00 PM GMT+7

      const afternoonShiftEndTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 5:00 PM GMT+7

      const fullDayShiftEndTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 5:00 PM GMT+7

      // Build employee query based on provided filter
      let employeeQuery = {};
      if (filter.department) {
        employeeQuery.department = filter.department;
      }
      if (filter.deviceId) {
        employeeQuery.deviceId = filter.deviceId;
      }

      let employees = await Employee.find(employeeQuery)
        .populate('department', 'name')
        .populate('position', 'name');

      // Get all check-ins for the specified day
      const employeeIds = employees.map(emp => emp.employeeId);
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));

      let checkinQuery = {
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      };
      // If a single deviceId is specified in the filter, add it to the checkin query
      if (filter.deviceId && typeof filter.deviceId === 'string') {
        checkinQuery.deviceId = filter.deviceId;
      } else if (filter.deviceId && filter.deviceId.$in) {
        // If deviceId is an $in array, add it to the checkin query
        checkinQuery.deviceId = { $in: filter.deviceId.$in };
      }

      const allCheckins = await Checkin.find(checkinQuery).sort({ timestamp: 1 });

      const mapEmployeeCheckinsOvertime = new Map();

      allCheckins.forEach(checkin => {
        const date = formatDateCustom(checkin.timestamp);
        const key = `${checkin.employeeId}_${date}`;
        if (!mapEmployeeCheckinsOvertime.has(key)) {
          mapEmployeeCheckinsOvertime.set(key, []);
        }
        mapEmployeeCheckinsOvertime.get(key).push(checkin);
      });

      const mapCountOvertime = new Map();
      const mapTotalOvertimeMinutes = new Map();

      mapEmployeeCheckinsOvertime.forEach((checkins, key) => {
        const employeeId = key.split('_')[0];
        const shift = employeeShiftMap.get(employeeId);

        if (checkins.length >= 2) { // Need at least two check-ins for full day calculation
          const firstCheckinTime = checkins[0].timestamp;
          const lastCheckinTime = checkins[checkins.length - 1].timestamp;

          let totalOvertimeMinutes = 0;

          if (shift === 'Cả ngày') {
            if (lastCheckinTime > fullDayShiftEndTime) {
              totalOvertimeMinutes = Math.round((lastCheckinTime - fullDayShiftEndTime) / (1000 * 60));
            }
          } else if (shift === 'Ca sáng') {
            if (lastCheckinTime > morningShiftEndTime) {
              totalOvertimeMinutes = Math.round((lastCheckinTime - morningShiftEndTime) / (1000 * 60));
            }
          } else if (shift === 'Ca chiều') {
            if (lastCheckinTime > afternoonShiftEndTime) {
              totalOvertimeMinutes = Math.round((lastCheckinTime - afternoonShiftEndTime) / (1000 * 60));
            }
          }

          if (totalOvertimeMinutes > 0) {
            mapCountOvertime.set(employeeId, (mapCountOvertime.get(employeeId) || 0) + 1);
            mapTotalOvertimeMinutes.set(employeeId, (mapTotalOvertimeMinutes.get(employeeId) || 0) + totalOvertimeMinutes);
          }
        }
      });

      const mapEmployeeOvertimeToday = new Map();
      employeeIds.forEach(employeeId => {
        const key = `${employeeId}_${formatDateCustom(targetDate)}`;
        if (mapEmployeeCheckinsOvertime.has(key)) {
          const checkinsList = mapEmployeeCheckinsOvertime.get(key);
          if (checkinsList.length >= 2) {
            const firstCheckinTime = checkinsList[0].timestamp;
            const lastCheckinTime = checkinsList[checkinsList.length - 1].timestamp;
            const shift = employeeShiftMap.get(employeeId);
            let isOvertime = false;
            let tmpCheckIn = null;
            let overtimeMinutes = 0;

            if (shift === 'Cả ngày') {
              if (lastCheckinTime > fullDayShiftEndTime) {
                isOvertime = true;
                overtimeMinutes = Math.round((lastCheckinTime - fullDayShiftEndTime) / (1000 * 60));
              }
            } else if (shift === 'Ca sáng') {
              if (lastCheckinTime > morningShiftEndTime) {
                isOvertime = true;
                overtimeMinutes = Math.round((lastCheckinTime - morningShiftEndTime) / (1000 * 60));
              }
            } else if (shift === 'Ca chiều') {
              if (lastCheckinTime > afternoonShiftEndTime) {
                isOvertime = true;
                overtimeMinutes = Math.round((lastCheckinTime - afternoonShiftEndTime) / (1000 * 60));
              }
            }
            if (isOvertime) {
              mapEmployeeOvertimeToday.set(employeeId, {
                checkin: checkinsList[0],
                checkout: checkinsList[checkinsList.length - 1],
                overtimeMinutes: overtimeMinutes
              });
            }
          }
        }
      });

      const employeeOvertimeTodayList = Array.from(mapEmployeeOvertimeToday.values())
        .map(data => {
          const employee = employeeMap.get(data.checkin.employeeId);
          return {
            "Id": employee.employeeId,
            "employeeName": employee.fullName,
            "department": employee.department ? employee.department.name : 'N/A',
            "position": employee.position ? employee.position.name : 'N/A',
            "shift": employee.shift,
            "checkinTime": `${new Date(data.checkin.timestamp).getUTCHours()}:${new Date(data.checkin.timestamp).getUTCMinutes()}`,
            "checkoutTime": `${new Date(data.checkout.timestamp).getUTCHours()}:${new Date(data.checkout.timestamp).getUTCMinutes()}`,
            "overtimeMinutes": `${data.overtimeMinutes} phút`,
            "countOvertime": mapCountOvertime.get(data.checkin.employeeId) || 0,
            "totalOvertimeHours": formatMinutesToHoursAndMinutes(mapTotalOvertimeMinutes.get(data.checkin.employeeId) || 0)
          };
        });

      return {
        status: 200,
        message: 'Overtime employees retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: filter.department && filter.department !== 'all' ? (await Department.findById(filter.department)).name : 'All Departments',
          totalEmployees: employees.length,
          overtimeEmployees: employeeOvertimeTodayList.length,
          employees: employeeOvertimeTodayList
        }
      };

    } catch (error) {
      console.error('Error in getOvertimeEmployees:', error);
      return {
        status: 500,
        message: 'Could not retrieve overtime employees: ' + error.message,
        data: null
      };
    }
  },

  updateEmployeeAvatar: async (employeeId, imageAvatar) => {
    try {
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId },
        { imageAvatar },
        { new: true }
      ).populate([
        { path: 'department', select: 'name' },
        { path: 'position', select: 'name' }
      ]);
      return updatedEmployee;
    } catch (error) {
      console.error('Error in updateEmployeeAvatar:', error);
      throw error;
    }
  },

  getEmployeesByDepartmentAndDate: async (departmentId, startDate, endDate) => {
    try {
      // Set end of day for endDate
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Convert dates to start of day for startDate
      const startOfDay = new Date(Date.UTC(
        startDate.getFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0, 0, 0, 0
      ));

      console.log('Start Date:', startOfDay);
      console.log('End Date:', endOfDay);

      // Build query conditions
      const query = {};

      // Add department filter if provided
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return {
            status: 404,
            message: 'Department not found',
            data: null
          };
        }
        query.department = departmentId;
      }

      console.log('Query conditions:', JSON.stringify(query, null, 2));

      // Get employees with populated department and position
      const allEmployees = await Employee.find(query)
        .populate('department', 'name')
        .populate('position', 'name')
        .sort({ registrationDate: -1 });

      // Filter employees by date range
      const employees = allEmployees.filter(emp => {
        const regDate = new Date(emp.registrationDate);
        return regDate >= startOfDay && regDate <= endOfDay;
      });

      console.log('Total employees before date filter:', allEmployees.length);
      console.log('Found employees after date filter:', employees.length);

      // Format response
      const formattedEmployees = employees.map(emp => ({
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department ? emp.department.name : 'N/A',
        position: emp.position ? emp.position.name : 'N/A',
        registrationDate: emp.registrationDate,
        status: emp.status,
        imageAvatar: emp.imageAvatar,
        faceImage: emp.faceImage,
        image34: emp.image34,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt
      }));

      return {
        totalEmployees: employees.length,
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        department: departmentId ? (await Department.findById(departmentId)).name : 'All Departments',
        employees: formattedEmployees
      };
    } catch (error) {
      console.error('Error in getEmployeesByDepartmentAndDate:', error);
      throw error;
    }
  },

  createTestCheckin: async (employeeId, checkinStatus, timestamp) => {
    try {
      // Find employee
      const employee = await Employee.findOne({ employeeId })
        .populate('department', 'name')
        .populate('position', 'name');

      if (!employee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      // Create check-in record
      const newCheckin = new Checkin({
        deviceId: 'TEST_DEVICE',
        employeeId: employee._id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        faceId: 'TEST_FACE_ID',
        checkinStatus: checkinStatus
      });

      await newCheckin.save();

      // Format response
      const response = {
        status: 201,
        message: 'Test check-in created successfully',
        data: {
          ID: employee.employeeId,
          Employee: employee.fullName,
          Department: employee.department ? employee.department.name : 'N/A',
          Position: employee.position ? employee.position.name : 'N/A',
          Shift: employee.shift,
          Status: checkinStatus,
          Timestamp: newCheckin.timestamp.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
        }
      };

      return response;
    } catch (error) {
      return {
        status: 500,
        message: 'Could not create test check-in: ' + error.message,
        data: null
      };
    }
  },

  getMonthlyStatistics: async (employeeId, year, month) => {
    try {
      // Get employee information
      const employee = await Employee.findOne({ employeeId })
        .populate('department', 'name')
        .populate('position', 'name');

      if (!employee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      // Calculate start and end dates for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      // Get all check-ins for the month
      const checkins = await Checkin.find({
        employeeId,
      }).sort({ timestamp: 1 });
      // console.log("checkins = ", checkins);
      // Initialize statistics
      let checkinsInMonth = [];
      const countLateMap = new Map();
      checkins.forEach(checkin => {
        
        if (checkin.timestamp && checkin.timestamp.getUTCMonth() === month - 1 && checkin.timestamp.getUTCFullYear() === year) {
          checkinsInMonth.push(checkin);
          const key = `${checkin.employeeId}_${formatDateCustom(checkin.timestamp)}`;
          if (!countLateMap.has(key)) {
            countLateMap.set(key, []);
          }
          countLateMap.get(key).push(checkin);
        }
      });
      console.log("checkinsInMonth = ", checkinsInMonth);
      const stats = {
        workingDays: 0,
        totalWorkingHours: 0,
        overtimeHours: 0,
        lateDays: 0,
        absentDays: 0,
        averageCheckinTime: null,
        averageCheckoutTime: null,
        attendanceRate: 0
      };

      // Calculate working days and other metrics
      const workingDaysSet = new Set();
      const totalWorkingHoursMap = new Map();
      const overtimeHoursMap = new Map();   
      const lateDaysMap = new Map();
      const absentDaysMap = new Map();
      let checkinTimes = [];
      let checkoutTimes = [];

      checkinsInMonth.forEach(checkin => {
        const key = `${checkin.employeeId}_${formatDateCustom(checkin.timestamp)}`;
        console.log("key = ", key);
        if (countLateMap.has(key)) {
          const checkins = countLateMap.get(key);
          if (checkins.length > 1) {
            // Get check-in and check-out times
            const checkinTime = new Date(checkins[0].timestamp);
            const checkoutTime = new Date(checkins[1].timestamp);
            
            // Add to check-in/out time arrays for average calculation
            checkinTimes.push(checkinTime);
            checkoutTimes.push(checkoutTime);

            // Calculate working hours for this day
            const diffInMilliseconds = checkoutTime - checkinTime;
            console.log("diffInMilliseconds = ", diffInMilliseconds);
            const diffInHours = diffInMilliseconds / (1000 * 60 * 60); // convert to hours
            totalWorkingHoursMap.set(key, diffInHours);

            workingDaysSet.add(formatDateCustom(checkinTime));

            // Calculate overtime based on shift
            const shift = employee.shift;
            let standardEndTime;

            if (shift === 'Cả ngày') {
              standardEndTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                17, 0, 0, 0
              )); // 17:00 GMT+7
            } else if (shift === 'Ca sáng') {
              standardEndTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                12, 0, 0, 0
              )); // 12:00 GMT+7
            } else if (shift === 'Ca chiều') {
              standardEndTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                17, 0, 0, 0
              )); // 17:00 GMT+7
            }

            // Calculate overtime if checkout is after standard end time
            if (checkoutTime > standardEndTime) {
              const overtimeMilliseconds = checkoutTime - standardEndTime;
              const overtimeHoursForDay = overtimeMilliseconds / (1000 * 60 * 60);
              overtimeHoursMap.set(key, overtimeHoursForDay);
            }

            // Check for late arrival
            let standardStartTime;
            if (shift === 'Cả ngày' || shift === 'Ca sáng') {
              standardStartTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                8, 0, 0, 0
              )); // 8:00 GMT+7
            } else if (shift === 'Ca chiều') {
              standardStartTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                13, 0, 0, 0
              )); // 13:00 GMT+7
            }
            console.log("checkinTime = ", checkinTime, "standardStartTime = ", standardStartTime);
            if (checkinTime > standardStartTime) {
              lateDaysMap.set(key, checkinTime);
            }
          } else {
            absentDaysMap.set(key, checkinTime);
          }
        }
      });

      let totalWorkingHours = 0;
      let overtimeHours = 0;
      // Round the hours to 2 decimal places
      totalWorkingHoursMap.forEach((value, key) => {
        totalWorkingHours += value;
      });
      overtimeHoursMap.forEach((value, key) => {
        overtimeHours += value;
      });

      const averageCheckinTime = calculateAverageTime(checkinTimes);
      const averageCheckoutTime = calculateAverageTime(checkoutTimes);

      // Calculate total working days in the month
      const totalDaysInMonth = new Date(year, month, 0).getDate();
      console.log("totalDaysInMonth = ", totalDaysInMonth);
      // Calculate attendance rate
      const attendanceRate = (stats.workingDays / totalDaysInMonth) * 100;
      console.log("attendanceRate = ", attendanceRate);

      stats.lateDays = lateDaysMap.size;
      stats.absentDays = absentDaysMap.size;
      stats.workingDays = workingDaysSet.size;
      stats.totalWorkingHours = totalWorkingHours;
      stats.overtimeHours = overtimeHours;
      stats.averageCheckinTime = averageCheckinTime;
      stats.averageCheckoutTime = averageCheckoutTime;
      stats.attendanceRate = attendanceRate;

      return {
        status: 200,
        message: 'Monthly statistics retrieved successfully',
        data: {
          employee: {
            employeeId: employee.employeeId,
            fullName: employee.fullName,
            department: employee.department ? employee.department.name : 'N/A',
            position: employee.position ? employee.position.name : 'N/A'
          },
          month: month,
          year: year,
          statistics: stats
        }
      };
    } catch (error) {
      console.error('Error in getMonthlyStatistics:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  getMonthlyAttendanceSummary: async (year, month, departmentId, deviceIdFilter = {}) => {
    try {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      let employeeQuery = {};
      if (departmentId && departmentId !== 'all') {
        employeeQuery.department = departmentId;
      }
      if (deviceIdFilter.deviceId) {
        employeeQuery.deviceId = deviceIdFilter.deviceId;
      }

      const employees = await Employee.find(employeeQuery)
        .populate('department', 'name')
        .populate('position', 'name');

      const employeeIds = employees.map(emp => emp.employeeId);

      let checkinsQuery = {
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startDate, $lte: endDate }
      };

      if (deviceIdFilter.deviceId && typeof deviceIdFilter.deviceId === 'string') {
        checkinsQuery.deviceId = deviceIdFilter.deviceId;
      } else if (deviceIdFilter.deviceId && deviceIdFilter.deviceId.$in) {
        checkinsQuery.deviceId = { $in: deviceIdFilter.deviceId.$in };
      }

      const checkins = await Checkin.find(checkinsQuery).sort({ employeeId: 1, timestamp: 1 });

      const employeeAttendance = new Map();

      employees.forEach(employee => {
        employeeAttendance.set(employee.employeeId, {
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          department: employee.department ? employee.department.name : 'N/A',
          position: employee.position ? employee.position.name : 'N/A',
          totalDaysPresent: 0,
          totalLate: 0,
          totalEarlyLeave: 0,
          totalOvertimeHours: 0,
          averageCheckinTime: 'N/A',
          averageCheckoutTime: 'N/A',
          dailyRecords: []
        });
      });

      const dailyCheckins = new Map(); // Map to store check-ins for each employee for each day

      checkins.forEach(checkin => {
        const dateKey = checkin.timestamp.toISOString().split('T')[0];
        const employeeId = checkin.employeeId;
        const mapKey = `${employeeId}_${dateKey}`;

        if (!dailyCheckins.has(mapKey)) {
          dailyCheckins.set(mapKey, []);
        }
        dailyCheckins.get(mapKey).push(checkin);
      });

      dailyCheckins.forEach((records, mapKey) => {
        const [employeeId, dateKey] = mapKey.split('_');
        const employee = employeeAttendance.get(employeeId);
        if (!employee) return;

        employee.totalDaysPresent++;

        const firstCheckin = records[0];
        const lastCheckin = records[records.length - 1];

        // Calculate late
        const shift = employees.find(emp => emp.employeeId === employeeId)?.shift;
        let isLate = false;
        let isEarlyLeave = false;
        let overtimeMinutes = 0;

        const checkinDate = new Date(dateKey);
        const morningShiftLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 8, 0, 0, 0));
        const afternoonShiftLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 13, 0, 0, 0));
        const fullDayLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 8, 0, 0, 0));

        if (shift === 'Cả ngày') {
          if (firstCheckin.timestamp > fullDayLateTime) isLate = true;
        } else if (shift === 'Ca sáng') {
          if (firstCheckin.timestamp > morningShiftLateTime) isLate = true;
        } else if (shift === 'Ca chiều') {
          if (firstCheckin.timestamp > afternoonShiftLateTime) isLate = true;
        }

        if (isLate) employee.totalLate++;

        // Calculate early leave and overtime only if there are at least two check-ins
        if (records.length >= 2) {
          const morningShiftEarlyLeaveTime = new Date(Date.UTC(
            checkinDate.getFullYear(),
            checkinDate.getUTCMonth(),
            checkinDate.getUTCDate(),
            12, 0, 0, 0
          ));
          const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(
            checkinDate.getFullYear(),
            checkinDate.getUTCMonth(),
            checkinDate.getUTCDate(),
            17, 0, 0, 0
          ));
          const fullDayEarlyLeaveTime = new Date(Date.UTC(
            checkinDate.getFullYear(),
            checkinDate.getUTCMonth(),
            checkinDate.getUTCDate(),
            17, 0, 0, 0
          ));

          if (shift === 'Cả ngày') {
            if (lastCheckin.timestamp < fullDayEarlyLeaveTime) isEarlyLeave = true;
          } else if (shift === 'Ca sáng') {
            if (lastCheckin.timestamp < morningShiftEarlyLeaveTime) isEarlyLeave = true;
          } else if (shift === 'Ca chiều') {
            if (lastCheckin.timestamp < afternoonShiftEarlyLeaveTime) isEarlyLeave = true;
          }

          if (isEarlyLeave) employee.totalEarlyLeave++;

          const morningShiftEndTime = new Date(Date.UTC(
            checkinDate.getFullYear(),
            checkinDate.getUTCMonth(),
            checkinDate.getUTCDate(),
            12, 0, 0, 0
          ));
          const afternoonShiftEndTime = new Date(Date.UTC(
            checkinDate.getFullYear(),
            checkinDate.getUTCMonth(),
            checkinDate.getUTCDate(),
            17, 0, 0, 0
          ));
          const fullDayShiftEndTime = new Date(Date.UTC(
            checkinDate.getFullYear(),
            checkinDate.getUTCMonth(),
            checkinDate.getUTCDate(),
            17, 0, 0, 0
          ));

          if (shift === 'Cả ngày') {
            if (lastCheckin.timestamp > fullDayShiftEndTime) {
              overtimeMinutes = Math.round((lastCheckin.timestamp - fullDayShiftEndTime) / (1000 * 60));
            }
          } else if (shift === 'Ca sáng') {
            if (lastCheckin.timestamp > morningShiftEndTime) {
              overtimeMinutes = Math.round((lastCheckin.timestamp - morningShiftEndTime) / (1000 * 60));
            }
          } else if (shift === 'Ca chiều') {
            if (lastCheckin.timestamp > afternoonShiftEndTime) {
              overtimeMinutes = Math.round((lastCheckin.timestamp - afternoonShiftEndTime) / (1000 * 60));
            }
          }

          employee.totalOvertimeHours += overtimeMinutes;
        }

        employee.dailyRecords.push({
          date: dateKey,
          checkinTime: firstCheckin.timestamp,
          checkoutTime: records.length >= 2 ? lastCheckin.timestamp : null,
          isLate: isLate,
          isEarlyLeave: isEarlyLeave,
          overtimeMinutes: overtimeMinutes
        });

      });

      const resultList = Array.from(employeeAttendance.values()).map(emp => ({
        ...emp,
        totalOvertimeHours: formatMinutesToHoursAndMinutes(emp.totalOvertimeHours),
        // Calculate average check-in/out times
        averageCheckinTime: calculateAverageTime(emp.dailyRecords.map(rec => rec.checkinTime)),
        averageCheckoutTime: calculateAverageTime(emp.dailyRecords.filter(rec => rec.checkoutTime).map(rec => rec.checkoutTime))
      }));

      return {
        status: 200,
        message: 'Monthly attendance summary retrieved successfully',
        data: resultList
      };

    } catch (error) {
      console.error('Error in getMonthlyAttendanceSummary:', error);
      return {
        status: 500,
        message: 'Could not retrieve monthly attendance summary: ' + error.message,
        data: null
      };
    }
  },

  getEmployeesWithAttendanceSummary: async (departmentId, positionId, deviceIdFilter = {}) => {
    try {
      const now = new Date();
      const startOfDayUTC = new Date(Date.UTC(now.getFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const endOfDayUTC = new Date(Date.UTC(now.getFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

      const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getUTCMonth(), 1));
      const currentMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

      let matchQuery = {};
      if (departmentId && departmentId !== 'all') {
        matchQuery.department = mongoose.Types.ObjectId(departmentId);
      }
      if (positionId && positionId !== 'all') {
        matchQuery.position = mongoose.Types.ObjectId(positionId);
      }
      if (deviceIdFilter.deviceId) {
        matchQuery.deviceId = deviceIdFilter.deviceId;
      }

      const employees = await Employee.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'checkins',
            let: { employeeId: '$employeeId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$employeeId', '$$employeeId'] },
                  timestamp: { $gte: currentMonthStart, $lte: currentMonthEnd },
                  ...(deviceIdFilter.deviceId ? { deviceId: deviceIdFilter.deviceId } : {})
                }
              },
              { $sort: { timestamp: 1 } }
            ],
            as: 'checkinsThisMonth'
          }
        },
        {
          $lookup: {
            from: 'checkins',
            let: { employeeId: '$employeeId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$employeeId', '$$employeeId'] },
                  timestamp: { $gte: startOfDayUTC, $lte: endOfDayUTC },
                  ...(deviceIdFilter.deviceId ? { deviceId: deviceIdFilter.deviceId } : {})
                }
              },
              { $sort: { timestamp: 1 } }
            ],
            as: 'checkinsToday'
          }
        },
        {
          $addFields: {
            totalCheckinsThisMonth: { $size: '$checkinsThisMonth' },
            // Determine if present today (at least one check-in)
            isPresentToday: { $gt: [{ $size: '$checkinsToday' }, 0] },
            firstCheckinToday: { $arrayElemAt: ['$checkinsToday.timestamp', 0] },
            lastCheckinToday: { $arrayElemAt: ['$checkinsToday.timestamp', { $subtract: [{ $size: '$checkinsToday' }, 1] }] }
          }
        },
        {
          $project: {
            _id: 0,
            employeeId: '$employeeId',
            fullName: '$fullName',
            department: '$department',
            position: '$position',
            shift: '$shift',
            isPresentToday: 1,
            firstCheckinToday: 1,
            lastCheckinToday: 1,
            totalCheckinsThisMonth: 1,
            totalLateThisMonth: 0,  // Will calculate in post-processing
            totalEarlyLeaveThisMonth: 0, // Will calculate in post-processing
            totalOvertimeMinutesThisMonth: 0 // Will calculate in post-processing
          }
        }
      ]);

      // Post-processing to calculate late, early leave, and overtime for each employee for the month
      const processEmployeeAttendance = (employee, checkins) => {
        let totalLate = 0;
        let totalEarlyLeave = 0;
        let totalOvertimeMinutes = 0;

        const dailyCheckins = new Map();
        checkins.forEach(checkin => {
          const dateKey = checkin.timestamp.toISOString().split('T')[0];
          if (!dailyCheckins.has(dateKey)) {
            dailyCheckins.set(dateKey, []);
          }
          dailyCheckins.get(dateKey).push(checkin);
        });

        dailyCheckins.forEach((records, dateKey) => {
          const checkinDate = new Date(dateKey);
          const firstCheckin = records[0];
          const lastCheckin = records[records.length - 1];

          // Shift times in UTC for calculation
          const morningShiftLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 8, 0, 0, 0));
          const afternoonShiftLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 13, 0, 0, 0));
          const fullDayLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 8, 0, 0, 0));

          const morningShiftEarlyLeaveTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 12, 0, 0, 0));
          const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));
          const fullDayEarlyLeaveTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));

          const morningShiftEndTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 12, 0, 0, 0));
          const afternoonShiftEndTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));
          const fullDayShiftEndTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));

          // Late calculation
          if (employee.shift === 'Cả ngày') {
            if (firstCheckin.timestamp > fullDayLateTime) totalLate++;
          } else if (employee.shift === 'Ca sáng') {
            if (firstCheckin.timestamp > morningShiftLateTime) totalLate++;
          } else if (employee.shift === 'Ca chiều') {
            if (firstCheckin.timestamp > afternoonShiftLateTime) totalLate++;
          }

          // Early leave and overtime calculation (only if at least two check-ins)
          if (records.length >= 2) {
            if (employee.shift === 'Cả ngày') {
              if (lastCheckin.timestamp < fullDayEarlyLeaveTime) totalEarlyLeave++;
              if (lastCheckin.timestamp > fullDayShiftEndTime) {
                totalOvertimeMinutes += Math.round((lastCheckin.timestamp - fullDayShiftEndTime) / (1000 * 60));
              }
            } else if (employee.shift === 'Ca sáng') {
              if (lastCheckin.timestamp < morningShiftEarlyLeaveTime) totalEarlyLeave++;
              if (lastCheckin.timestamp > morningShiftEndTime) {
                totalOvertimeMinutes += Math.round((lastCheckin.timestamp - morningShiftEndTime) / (1000 * 60));
              }
            } else if (employee.shift === 'Ca chiều') {
              if (lastCheckin.timestamp < afternoonShiftEarlyLeaveTime) totalEarlyLeave++;
              if (lastCheckin.timestamp > afternoonShiftEndTime) {
                totalOvertimeMinutes += Math.round((lastCheckin.timestamp - afternoonShiftEndTime) / (1000 * 60));
              }
            }
          }
        });

        return { totalLate, totalEarlyLeave, totalOvertimeMinutes };
      };

      const finalEmployees = employees.map(employee => {
        const { totalLate, totalEarlyLeave, totalOvertimeMinutes } = processEmployeeAttendance(employee, employee.checkinsThisMonth);
        return {
          ...employee,
          totalLateThisMonth: totalLate,
          totalEarlyLeaveThisMonth: totalEarlyLeave,
          totalOvertimeMinutesThisMonth: totalOvertimeMinutes
        };
      });

      return {
        status: 200,
        message: 'Employees with attendance summary retrieved successfully',
        data: finalEmployees
      };

    } catch (error) {
      console.error('Error in getEmployeesWithAttendanceSummary:', error);
      return {
        status: 500,
        message: 'Could not retrieve employees with attendance summary: ' + error.message,
        data: null
      };
    }
  },

  getAttendanceOverview: async (departmentId, positionId, date, deviceIdFilter = {}) => {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));
      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      let employeeMatchQuery = {};
      if (departmentId && departmentId !== 'all') {
        employeeMatchQuery.department = departmentId;
      }
      if (positionId && positionId !== 'all') {
        employeeMatchQuery.position = positionId;
      }
      if (deviceIdFilter.deviceId) {
        employeeMatchQuery.deviceId = deviceIdFilter.deviceId;
      }

      const employees = await Employee.find(employeeMatchQuery);

      const employeeIds = employees.map(emp => emp.employeeId);
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));

      let checkinQuery = {
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      };

      if (deviceIdFilter.deviceId && typeof deviceIdFilter.deviceId === 'string') {
        checkinQuery.deviceId = deviceIdFilter.deviceId;
      } else if (deviceIdFilter.deviceId && deviceIdFilter.deviceId.$in) {
        checkinQuery.deviceId = { $in: deviceIdFilter.deviceId.$in };
      }

      const checkinsToday = await Checkin.find(checkinQuery).sort({ employeeId: 1, timestamp: 1 });

      const presentEmployeeIds = new Set(checkinsToday.map(c => c.employeeId));
      const totalEmployees = employees.length;
      const employeesPresent = presentEmployeeIds.size;
      const employeesAbsent = totalEmployees - employeesPresent;

      let totalLate = 0;
      let totalEarlyLeave = 0;
      let totalOvertimeMinutes = 0;

      const dailyCheckinsMap = new Map();
      checkinsToday.forEach(checkin => {
        const employeeId = checkin.employeeId;
        if (!dailyCheckinsMap.has(employeeId)) {
          dailyCheckinsMap.set(employeeId, []);
        }
        dailyCheckinsMap.get(employeeId).push(checkin);
      });

      dailyCheckinsMap.forEach((records, employeeId) => {
        const employee = employees.find(emp => emp.employeeId === employeeId);
        if (!employee) return;

        const firstCheckin = records[0];
        const lastCheckin = records[records.length - 1];

        const checkinDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

        // Shift times in UTC for calculation
        const morningShiftLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 8, 0, 0, 0));
        const afternoonShiftLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 13, 0, 0, 0));
        const fullDayLateTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 8, 0, 0, 0));

        const morningShiftEarlyLeaveTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 12, 0, 0, 0));
        const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));
        const fullDayEarlyLeaveTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));

        const morningShiftEndTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 12, 0, 0, 0));
        const afternoonShiftEndTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));
        const fullDayShiftEndTime = new Date(Date.UTC(checkinDate.getFullYear(), checkinDate.getUTCMonth(), checkinDate.getUTCDate(), 17, 0, 0, 0));

        // Late calculation
        if (employee.shift === 'Cả ngày') {
          if (firstCheckin.timestamp > fullDayLateTime) totalLate++;
        } else if (employee.shift === 'Ca sáng') {
          if (firstCheckin.timestamp > morningShiftLateTime) totalLate++;
        } else if (employee.shift === 'Ca chiều') {
          if (firstCheckin.timestamp > afternoonShiftLateTime) totalLate++;
        }

        // Early leave and overtime calculation (only if at least two check-ins)
        if (records.length >= 2) {
          if (employee.shift === 'Cả ngày') {
            if (lastCheckin.timestamp < fullDayEarlyLeaveTime) totalEarlyLeave++;
            if (lastCheckin.timestamp > fullDayShiftEndTime) {
              totalOvertimeMinutes += Math.round((lastCheckin.timestamp - fullDayShiftEndTime) / (1000 * 60));
            }
          } else if (employee.shift === 'Ca sáng') {
            if (lastCheckin.timestamp < morningShiftEarlyLeaveTime) totalEarlyLeave++;
            if (lastCheckin.timestamp > morningShiftEndTime) {
              totalOvertimeMinutes += Math.round((lastCheckin.timestamp - morningShiftEndTime) / (1000 * 60));
            }
          } else if (employee.shift === 'Ca chiều') {
            if (lastCheckin.timestamp < afternoonShiftEarlyLeaveTime) totalEarlyLeave++;
            if (lastCheckin.timestamp > afternoonShiftEndTime) {
              totalOvertimeMinutes += Math.round((lastCheckin.timestamp - afternoonShiftEndTime) / (1000 * 60));
            }
          }
        }
      });

      return {
        status: 200,
        message: 'Attendance overview retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId && departmentId !== 'all' ? (await Department.findById(departmentId)).name : 'All Departments',
          position: positionId && positionId !== 'all' ? (await Position.findById(positionId)).name : 'All Positions',
          totalEmployees,
          employeesPresent,
          employeesAbsent,
          totalLate,
          totalEarlyLeave,
          totalOvertimeHours: formatMinutesToHoursAndMinutes(totalOvertimeMinutes)
        }
      };

    } catch (error) {
      console.error('Error in getAttendanceOverview:', error);
      return {
        status: 500,
        message: 'Could not retrieve attendance overview: ' + error.message,
        data: null
      };
    }
  },
};

module.exports = employeeService; 