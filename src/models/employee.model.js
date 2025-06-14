const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: false,
    match: [/^[0-9]{10}$/, 'Please enter a valid phone number']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: false
  },
  shift: {
    type: String,
    default: ''
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  faceImage: {
    type: String,  // Base64 string or file path
    default: ''
  },
  imageAvatar: {
    type: String,  // Base64 string or file path
    default: ''
  },
  image34: {
    type: String,  // Base64 string or file path
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  deviceId: {
    type: String,
    required: false,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Employee might not always be linked to a specific user for creation
  }
}, {
  timestamps: true
});


const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee; 