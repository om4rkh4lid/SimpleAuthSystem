const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController')

const userRouter = express.Router()

userRouter.route('/search')
.all(authController.protect)
.get(authController.restrictTo('user', 'admin'), userController.search)

module.exports = userRouter
