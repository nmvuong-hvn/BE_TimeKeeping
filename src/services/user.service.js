const User = require('../models/user.model');

const getAllUsers = async () => {
    return await User.find().select('-password'); // Exclude password from results
};

const getUserById = async (id) => {
    return await User.findById(id).select('-password');
};

const getUserByUsername = async (username) => {
    return await User.findOne({ username });
};

const createUser = async (userData) => {
    const newUser = new User(userData);
    return await newUser.save();
};

const updateUser = async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
};

const deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

module.exports = {
    getAllUsers,
    getUserById,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser
}; 