const express = require('express');
const { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } = require('../controllers/hospitals');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Hospital:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - district
 *         - province
 *         - postalcode
 *         - region
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB hospital ID
 *           example: 609bda561452242d88d36e37
 *         name:
 *           type: string
 *           description: Hospital name
 *         address:
 *           type: string
 *           description: House number, street and road
 *         district:
 *           type: string
 *         province:
 *           type: string
 *         postalcode:
 *           type: string
 *           description: 5-digit postal code
 *         tel:
 *           type: string
 *         region:
 *           type: string
 *       example:
 *         _id: 609bda561452242d88d36e37
 *         name: Happy Hospital
 *         address: 121 Sukhumvit Road
 *         district: Bang Na
 *         province: Bangkok
 *         postalcode: '10110'
 *         tel: 02-2187000
 *         region: Bangkok
 * tags:
 *   - name: Hospitals
 *     description: The hospitals managing API
 */

/**
 * @swagger
 * /api/v1/hospitals:
 *   get:
 *     summary: Returns the list of all hospitals
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: Hospital list with count and pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hospital'
 *   post:
 *     summary: Create a new hospital
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HospitalInput'
 *     responses:
 *       201:
 *         description: Hospital was created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hospital'
 *       400:
 *         description: Invalid hospital data
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /api/v1/hospitals/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       description: Hospital ID
 *       schema:
 *         type: string
 *   get:
 *     summary: Get a hospital by ID
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: Hospital details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hospital'
 *       400:
 *         description: Hospital not found or invalid ID
 *   put:
 *     summary: Update a hospital by ID
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HospitalInput'
 *     responses:
 *       200:
 *         description: Hospital was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hospital'
 *       400:
 *         description: Hospital not found or invalid data
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin role required
 *   delete:
 *     summary: Delete a hospital by ID
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     description: Admin only. Also deletes this hospital's appointments.
 *     responses:
 *       200:
 *         description: Hospital was deleted
 *       400:
 *         description: Invalid hospital ID
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Hospital not found
 */

const router = express.Router();
router.use('/:hospitalId/appointments', require('./appointments'));

router.route('/').get(getHospitals).post(protect, authorize('admin'), createHospital);
router
  .route('/:id')
  .get(getHospital)
  .put(protect, authorize('admin'), updateHospital)
  .delete(protect, authorize('admin'), deleteHospital);

module.exports = router;
