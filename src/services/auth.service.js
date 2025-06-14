const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

const findUserByUsername = async (username) => {
    return await User.findOne({ username });
};

const comparePassword = async (candidatePassword, hashedPassword) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = {
    findUserByUsername,
    comparePassword
}; 