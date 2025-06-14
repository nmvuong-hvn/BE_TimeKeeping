// Set timezone to GMT+7
process.env.TZ = 'Asia/Bangkok'; 

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/positions', require('./routes/position.routes'));
app.use('/api/checkins', require('./routes/checkin.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/devices', require('./routes/device.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: 'Something went wrong!',
    error: err.message
  });
});

module.exports = app; 