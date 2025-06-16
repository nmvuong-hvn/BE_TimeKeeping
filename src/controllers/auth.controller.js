const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const authController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("req.body = ", req.body);
      // Find user by username
      const user = await authService.findUserByUsername(username);
      if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log("user = ", user);
      // Compare provided password with hashed password in database
      const isMatch = await authService.comparePassword(password, user.password);
      console.log("isMatch = ", isMatch);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const payload = {
          id: user._id,
          username: user.username,
          role: user.role,
      }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      console.log("token = ", token);
      return res.status(200).json({
        status: 200,
        message: 'Login successful',
        data: {
          token,
          user: {
            _id: user._id,
            username: user.username,
            role: user.role,
            isAdmin: user.role === 'admin',
            imageAvatar: user.imageAvatar
          }
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  register: async (req, res) => {
    try {
      const { username, password, role, imageAvatar } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          status: 400,
          message: 'Username and password are required',
          data: null
        });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          status: 409,
          message: 'Username already exists',
          data: null
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username,
        password: hashedPassword,
        role: role || 'user',
        imageAvatar: imageAvatar || null
      });

      const token = jwt.sign(
        { 
          userId: newUser._id,
          username: newUser.username,
          role: newUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        status: 201,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role,
            isAdmin: newUser.role === 'admin',
            imageAvatar: newUser.imageAvatar
          }
        }
      });
    } catch (error) {
      console.error('Error in register:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  logout: async (req, res) => {
    try {
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = authController; 