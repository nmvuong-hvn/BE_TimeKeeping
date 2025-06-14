const express = require('express');
const router = express.Router();
const positionController = require('../controllers/position.controller');
const { auth, requireAdminOrSuperAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Get all positions
 *     tags: [Positions]
 *     responses:
 *       200:
 *         description: List of positions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Position'
 */
router.get('/', auth, requireAdminOrSuperAdmin, positionController.getAllPositions);

/**
 * @swagger
 * /api/positions:
 *   post:
 *     summary: Create a new position
 *     tags: [Positions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PositionRequest'
 *     responses:
 *       201:
 *         description: Position created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Position'
 */
router.post('/', auth, requireAdminOrSuperAdmin, positionController.createPosition);

/**
 * @swagger
 * /api/positions/department/{departmentId}:
 *   get:
 *     summary: Get positions by department
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of positions in department
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Position'
 *       404:
 *         description: Department not found
 */
router.get('/department/:departmentId', auth, requireAdminOrSuperAdmin, positionController.getPositionsByDepartment);

/**
 * @swagger
 * /api/positions/{positionId}:
 *   put:
 *     summary: Update position
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: positionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PositionRequest'
 *     responses:
 *       200:
 *         description: Position updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Position'
 *       404:
 *         description: Position not found
 */
router.put('/:positionId', auth, requireAdminOrSuperAdmin, positionController.updatePosition);

/**
 * @swagger
 * /api/positions/{positionId}:
 *   delete:
 *     summary: Delete position
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: positionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Position deleted successfully
 *       404:
 *         description: Position not found
 */
router.delete('/:positionId', auth, requireAdminOrSuperAdmin, positionController.deletePosition);

module.exports = router; 