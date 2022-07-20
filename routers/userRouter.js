const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController')

const userRouter = express.Router()

userRouter.route('/search')
.get(authController.protect, userController.search)

module.exports = userRouter
