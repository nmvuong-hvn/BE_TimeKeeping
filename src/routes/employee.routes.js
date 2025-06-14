const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { auth, requireAdminOrSuperAdmin, deviceAccess } = require('../middleware/auth');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Employees retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Server error
 */
router.get('/', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getAllEmployees);

/**
 * @swagger
 * /api/employees/late:
 *   get:
 *     summary: Get late employees
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check for late employees (YYYY-MM-DD)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Department ID to filter employees
 *     responses:
 *       200:
 *         description: Late employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Late employees retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     department:
 *                       type: string
 *                     totalEmployees:
 *                       type: number
 *                     lateEmployees:
 *                       type: number
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Id:
 *                             type: string
 *                           employeeName:
 *                             type: string
 *                           department:
 *                             type: string
 *                           position:
 *                             type: string
 *                           shift:
 *                             type: string
 *                           checkinTime:
 *                             type: string
 *                           lateMinutes:
 *                             type: string
 *                           countLate:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get('/late', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getLateEmployees);
/**
 * @swagger
 * /api/employees/early-leave:
 *   get:
 *     summary: Get early leave employees
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check for early leave employees (YYYY-MM-DD)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Department ID to filter employees
 *     responses:
 *       200:
 *         description: Early leave employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Early leave employees retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     department:
 *                       type: string
 *                     totalEmployees:
 *                       type: number
 *                     earlyLeaves:
 *                       type: number
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Id:
 *                             type: string
 *                           employeeName:
 *                             type: string
 *                           department:
 *                             type: string
 *                           position:
 *                             type: string
 *                           shift:
 *                             type: string
 *                           checkinTime:
 *                             type: string
 *                           earlyMinutes:
 *                             type: string
 *                           countEarlyLeave:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get('/early-leave', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getEarlyLeaveEmployees);


/**
 * @swagger
 * /api/employees/overtime:
 *   get:
 *     summary: Get overtime employees
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check for overtime employees (YYYY-MM-DD)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Department ID to filter employees
 *     responses:
 *       200:
 *         description: Overtime employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Overtime employees retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     department:
 *                       type: string
 *                     totalEmployees:
 *                       type: number
 *                     overtimeEmployees:
 *                       type: number
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           Id:
 *                             type: string
 *                           employeeName:
 *                             type: string
 *                           department:
 *                             type: string
 *                           position:
 *                             type: string
 *                           shift:
 *                             type: string
 *                           checkinTime:
 *                             type: string
 *                           overtimeMinutes:
 *                             type: string
 *                           countOvertime:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get('/overtime', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getOvertimeEmployees);
/**
 * @swagger
 * /api/employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Employee retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee (Admin or Superadmin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - fullName
 *               - deviceId
 *             properties:
 *               employeeId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               shift:
 *                 type: string
 *               faceImage:
 *                 type: string
 *               imageAvatar:
 *                 type: string
 *               image34:
 *                 type: string
 *               status:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Admin or Superadmin access required, or device access denied
 *       409:
 *         description: Employee with this ID already exists
 */
router.post('/', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.createEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeRequest'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Employee updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.put('/:employeeId',auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}:
 *   delete:
 *     summary: Delete an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Employee deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.delete('/:employeeId', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.deleteEmployee);




/**
 * @swagger
 * /api/employees/avatar/{employeeId}:
 *   put:
 *     summary: Update employee avatar
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageAvatar:
 *                 type: string
 *                 description: Base64 encoded image
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.put('/avatar/:employeeId', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.updateEmployeeAvatar);

/**
 * @swagger
 * /api/employees/by-department:
 *   get:
 *     summary: Get employees by department and date range
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Department ID to filter employees
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEmployees:
 *                   type: number
 *                 dateRange:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                 department:
 *                   type: string
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Server error
 */
router.get('/by-department', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getEmployeesByDepartmentAndDate);

/**
 * @swagger
 * /api/employees/test-checkin:
 *   post:
 *     summary: Create a test check-in record
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *               checkinStatus:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Test check-in created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Test check-in created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     ID:
 *                       type: string
 *                     Employee:
 *                       type: string
 *                     Department:
 *                       type: string
 *                     Position:
 *                       type: string
 *                     Shift:
 *                       type: string
 *                     Status:
 *                       type: string
 *                     Timestamp:
 *                       type: string
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.post('/test-checkin', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.createTestCheckin);

/**
 * @swagger
 * /api/employees/{employeeId}/monthly-statistics:
 *   get:
 *     summary: Get employee's monthly statistics
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2024)
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *     responses:
 *       200:
 *         description: Monthly statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Monthly statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     employee:
 *                       type: object
 *                       properties:
 *                         employeeId:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         department:
 *                           type: string
 *                         position:
 *                           type: string
 *                     month:
 *                       type: number
 *                     year:
 *                       type: number
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         workingDays:
 *                           type: number
 *                           description: Number of working days in the month
 *                         totalWorkingHours:
 *                           type: number
 *                           description: Total working hours in the month
 *                         overtimeHours:
 *                           type: number
 *                           description: Total overtime hours in the month
 *                         lateDays:
 *                           type: number
 *                           description: Number of days with late check-ins
 *                         absentDays:
 *                           type: number
 *                           description: Number of absent days
 *                         averageCheckinTime:
 *                           type: string
 *                           description: Average check-in time (HH:mm format)
 *                         averageCheckoutTime:
 *                           type: string
 *                           description: Average check-out time (HH:mm format)
 *                         attendanceRate:
 *                           type: number
 *                           description: Attendance rate as a percentage
 *       400:
 *         description: Invalid year or month
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Server error
 */
router.get('/:employeeId/monthly-statistics', auth, requireAdminOrSuperAdmin, deviceAccess, employeeController.getMonthlyStatistics);

module.exports = router;