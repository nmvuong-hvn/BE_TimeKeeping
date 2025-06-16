const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth, requireSuperAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       403:
 *         description: Forbidden - Superadmin only
 */
router.get('/', auth, requireSuperAdmin, userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: User not found
 */
router.get('/:id', auth, requireSuperAdmin, userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ['superadmin', 'admin']
 *               devices:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Superadmin only
 *       409:
 *         description: User already exists
 */
router.post('/',  userController.createUser);
/**
 * @swagger
 * /api/users/assign-devices:
 *   put:
 *     summary: Assign devices to an admin user
 *     description: Superadmin can assign multiple devices to an admin user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - deviceIds
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: MongoDB ObjectId of the admin user
 *                 example: "65f2e8b7c261e6001234abcd"
 *               deviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of device IDs to assign
 *                 example: ["device1", "device2", "device3"]
 *     responses:
 *       200:
 *         description: Devices assigned successfully
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
 *                   example: "Devices assigned successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Admin ID and array of device IDs are required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Please authenticate"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 message:
 *                   type: string
 *                   example: "Forbidden: Superadmin access required"
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "Admin not found or user is not an admin"
 */
router.put('/assign-devices', auth, requireSuperAdmin, userController.assignDevices);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update an existing user (Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ['superadmin', 'admin']
 *               devices:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: User not found
 */
router.put('/:id', auth, requireSuperAdmin, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Superadmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: User not found
 */
router.delete('/:id', auth, requireSuperAdmin, userController.deleteUser);


module.exports = router; 