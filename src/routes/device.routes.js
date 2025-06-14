const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { auth, requireSuperAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices (Superadmin only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices retrieved successfully
 *       403:
 *         description: Forbidden - Superadmin only
 */
router.get('/', auth, requireSuperAdmin, deviceController.getAllDevices);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get device by ID (Superadmin only)
 *     tags: [Devices]
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
 *         description: Device retrieved successfully
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: Device not found
 */
router.get('/:id', auth, requireSuperAdmin, deviceController.getDeviceById);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create a new device (Superadmin only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - name
 *             properties:
 *               deviceId:
 *                 type: string
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Superadmin only
 *       409:
 *         description: Device already exists
 */
router.post('/', auth, requireSuperAdmin, deviceController.createDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update an existing device (Superadmin only)
 *     tags: [Devices]
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
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: Device not found
 */
router.put('/:id', auth, requireSuperAdmin, deviceController.updateDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete a device (Superadmin only)
 *     tags: [Devices]
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
 *         description: Device deleted successfully
 *       403:
 *         description: Forbidden - Superadmin only
 *       404:
 *         description: Device not found
 */
router.delete('/:id', auth, requireSuperAdmin, deviceController.deleteDevice);

module.exports = router; 