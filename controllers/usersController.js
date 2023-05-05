const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc    Get all users
// @route   GET /users
// @access  Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();

    if(!users?.length) {
        return res.status(400).json({message: 'No users found'});
    }

    res.status(200).json(users);
});

// @desc    CREATE a user
// @route   POST /users
// @access  Private
const createUser = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body;

    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'Please fill in all fields'});
    }

    const duplicate = await User.findOne({username}).lean().exec();

    if(duplicate) {
        return res.status(409).json({message: 'Username already exists'});
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const userObj = {
        username,
        "password": hashedPwd,
        roles,
    };

    const user = await User.create(userObj);

    if(user) {
        res.status(201).json({message: `New user ${username} created`});
    }else {
        res.status(400).json({message: 'Invalid user data'});
    }
});

// @desc    UPDATE a user
// @route   PATCH /users
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
    const {id, username, active, password, roles} = req.body;

    if(!id || !username || typeof(active) !== 'boolean' || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'Please fill in all fields'});
    }

    const user = await User.findById(id).exec();

    if(!user) {
        return res.status(400).json({message: 'User not found'});
    }

    const duplicate = await User.findOne({username}).lean().exec();
    if(duplicate && duplicate._id !== id) {
        return res.status(409).json({message: 'Username already exists'});
    }

    user.username = username;
    user.active = active;
    user.roles = roles;

    if(password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        user.password = hashedPwd;
    }

    const updatedUser = await user.save();

    res.json({message: `User ${updatedUser.username} updated`});
});

// @desc    DELETE a user
// @route   DELETE /users
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.body;

    if(!id) {
        return res.status(400).json({message: 'User ID is required'});
    }

    const note = await Note.findOne({user
    : id}).lean().exec();
    if(note?.length) {
        return res.status(400).json({message: 'User has assigned notes'});
    }

    const user = await User.findById(id).exec();

    if(!user) {
        return res.status(400).json({message: 'User not found'});
    }

    const result = await user.deleteOne();
    const reply = `User ${result.username} with id ${result._id} deleted`;
    res.json({message: reply});

});

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
};