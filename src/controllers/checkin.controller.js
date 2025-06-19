const Checkin = require('../models/checkin.model');
const Employee = require('../models/employee.model');
const moment = require('moment');
const { formatDateCustom, calculateAverageTime, timeDifferenceISO, getRelativeTime } = require('../utils/date.utils');

const getCheckinHistory = async (req, res) => {
  try {
    const { employeeId, shift, month, year } = req.query;
    
    console.log(employeeId, month, year);
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: employeeId, month, year'
      });
    }

    // Get start and end date of the month
    const startDate = moment(`${year}-${month}-01`).startOf('month');
    const endDate = moment(`${year}-${month}-01`).endOf('month');

    // Get all check-ins for the employee in the specified month
    const checkins = await Checkin.find({
      employeeId,
    }).sort({ timestamp: 1 });

    const mapEmployeeCheckins = new Map();
    checkins.forEach(checkin => {
      const date = formatDateCustom(checkin.timestamp)
      const key = `${checkin.employeeId}_${date}`;
      if (!mapEmployeeCheckins.has(key)) {
        console.log("key = ", key);
        mapEmployeeCheckins.set(key, []);
      }
      mapEmployeeCheckins.get(key).push(checkin);
    });
    console.log("mapEmployeeCheckins = ", mapEmployeeCheckins);

    // Initialize daily records for all days in the month
    const dailyRecords = {};
    const workingHours = 8; // Standard working hours
    const lateThreshold = 8; // Minutes after which an employee is considered late

    // Create records for all days in the month
    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayOfWeek = currentDate.day(); // 0 is Sunday, 6 is Saturday
      
      // Set initial status based on day of week
      let initialStatus = 'Sắp tới';
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        initialStatus = 'Cuối Tuần';
      }

      dailyRecords[dateStr] = {
        date: dateStr,
        employeeId: employeeId,
        checkIn: null,
        checkOut: null,
        totalHours: 0,
        overtime: 0,
        status: initialStatus,
        timeLate: {hours: 0, minutes: 0}
      };
      currentDate.add(1, 'day');
    }

    console.log(dailyRecords);

    // Convert dailyRecords object to array
    const dailyRecordsArray = Object.values(dailyRecords);

    dailyRecordsArray.forEach(record => {
      const key = `${record.employeeId}_${record.date}`;
      if (mapEmployeeCheckins.has(key)) {
        const checkins = mapEmployeeCheckins.get(key);
        const checkinTime = checkins[0].timestamp;
        const checkoutTime = checkins[1].timestamp;

        if (checkins.length > 1) {
          record.checkIn = checkins[0].timestamp;
          record.checkOut = checkins[checkins.length - 1].timestamp;
          record.totalHours = calculateAverageTime(checkins);
          
          // Check if late
    
       

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

          const morningHomeTime = new Date(Date.UTC(
            checkoutTime.getFullYear(),
            checkoutTime.getUTCMonth(),
            checkoutTime.getUTCDate(),
            12, 0, 0, 0  
          )); // 12:00 GMT+7

          const afternoonHomeTime = new Date(Date.UTC(
            checkoutTime.getFullYear(),
            checkoutTime.getUTCMonth(),
            checkoutTime.getUTCDate(),
            17, 0, 0, 0
          )); // 17:00 GMT+7

          const fullHomeTime = new Date(Date.UTC(
            checkoutTime.getFullYear(),
            checkoutTime.getUTCMonth(),
            checkoutTime.getUTCDate(),
            17, 0, 0, 0
          )); // 17:00 GMT+7


          if(shift === 'Cả ngày'){
            if(checkinTime > fullLateTime){
              record.status = 'Đi muộn';
              record.timeLate = timeDifferenceISO(fullLateTime, checkinTime);
            }else {
              record.status = 'Có mặt';
            }
          } else if(shift === 'Ca sáng'){
            if(checkinTime > morningLateTime){
              record.status = 'Đi muộn';
              record.timeLate = timeDifferenceISO(morningLateTime, checkinTime);
            }else {
              record.status = 'Có mặt';
            }
          } else if(shift === 'Ca chiều'){
            if(checkinTime > afternoonLateTime){
              record.status = 'Đi muộn';
              record.timeLate = timeDifferenceISO(afternoonLateTime, checkinTime);
            }else {
              record.status = 'Có mặt';
            }
          }


          
          if(shift === 'Cả ngày'){
            if(checkoutTime > fullHomeTime){
              console.log("checkoutTime > fullHomeTime = ", checkoutTime - fullHomeTime);
              record.overtime = Math.abs(checkoutTime - fullHomeTime) /(1000 * 60 * 60);
            }else {
              record.overtime = 0;
            }
          } else if(shift === 'Ca sáng'){
            if(checkoutTime > morningHomeTime){
              record.overtime = Math.abs(checkoutTime - morningHomeTime) /(1000 * 60 * 60);
            }else {
              record.overtime = 0;
            }
            
          } else if(shift === 'Ca chiều'){
            if(checkoutTime > afternoonHomeTime){
              record.overtime = Math.abs(checkoutTime - afternoonHomeTime) /(1000 * 60 * 60);
            }else {
              record.overtime = 0;
            }
          }

        }else{
          record.checkIn = "-";
          record.checkOut = "-";
          // Keep the status as is (Cuối Tuần or Sắp tới)
        }
      }
    });

    // Sort the array by date
    const history = dailyRecordsArray.sort((a, b) => 
      moment(a.date).diff(moment(b.date))
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting check-in history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getAllCheckinsToday = async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

    // Get all check-ins for today
    const checkins = await Checkin.find({
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ timestamp: -1 });

    console.log("checkins = ", checkins);
    let employeeIds = [];

    // Group check-ins by employee
    checkins.forEach(checkin => {
      employeeIds.push(checkin.employeeId);
    });

    // Get all employee IDs

    // Get employee details with populated department and position
    const employees = await Employee.find({ employeeId: { $in: employeeIds } })
      .populate('department', 'name')
      .populate('position', 'name');

    // Create a map of employee details for quick lookup
    const employeeMap = new Map();
    employees.forEach(emp => {
      employeeMap.set(emp.employeeId, emp);
    });

    // Process check-ins for each employee
    const result = [];
    checkins.forEach((checkin) => {
      const employee = employeeMap.get(checkin.employeeId);
      if (!employee) return; // Skip if employee not found

      const checkinTime = checkin.timestamp;

      result.push({
        id: employee._id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        department: employee.department ? employee.department.name : '',
        position: employee.position ? employee.position.name : '',
        faceImage: employee.faceImage,
        checkIn: checkinTime.toISOString().replace('T', ' ').replace('Z', '').split('.')[0],
      });
    });
    console.log("result = ", result);
    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting today\'s check-ins:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getCheckinHistory,
  getAllCheckinsToday
}; 