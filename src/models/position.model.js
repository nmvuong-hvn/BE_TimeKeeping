const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Or true, depending on whether every position must have a creator
  }
}, {
  timestamps: true
});

const Position = mongoose.model('Position', positionSchema);

module.exports = Position; 