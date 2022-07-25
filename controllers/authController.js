const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require('util')

const signToken = (id) => {
    // Create a JWT to log the user in
    return jwt.sign(
        // payload
        { id },
        // secret
        process.env.JWT_SECRET,
        // options
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    )
}

exports.signup = catchAsync(async (req, res, next) => {
    // This way could be a security flaw as anyone can specify sensitive data like roles
    const user = await User.create(req.body);
    // const user = await User.create({
    //     username: req.body.username,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm,
    // });

    const token = signToken(user._id)

    res.status(200)
        .json({
            status: 'success',
            data: {
                token,
                user
            }
        })

})

exports.login = catchAsync(async (req, res, next) => {
    // Check if the username and password were sent
    const { username, password } = req.body;
    if (!username || !password) {
        const err = new Error('Please enter a username and password')
        err.statusCode = 400
        err.status = 'failure'
        return next(err)
    }
    // Check if the username exists and the password matches
    const user = await User.findOne({ username: username }).select('+password') // find a user matching the given criteria (has this username) and make sure to include the password (hence the + sign)
    if (!user || !(await user.correctPassword(password, user.password))) {
        const err = new Error('Incorrect username or password')
        err.statusCode = 401
        err.status = 'failure'
        return next(err)
    }
    // Create token and sign the user in
    const token = signToken(user._id)

    res.status(200).json({
        status: 'success',
        data: {
            token
        }
    })
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Get the token from the request headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        const err = new Error('You need to be logged in to access this resource.')
        err.statusCode = 401
        err.status = 'failure'
        return next(err)
    }

    // 2) Verify the token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Verify the user still exists
    const user = await User.findById(decoded.id)
    if (!user) {
        const err = new Error('You need to be logged in to access this resource.')
        err.statusCode = 401
        err.status = 'failure'
        return next(err)
    }

    // 4) Verify the user's password has not changed since the token was signed
    const f = user.changedPasswordAfter(decoded.iat)

    if (f) {
        const err = new Error('User has changed the password recently. Please log in again!')
        err.statusCode = 401
        err.status = 'failure'
        return next(err)
    }

    // add the user object to the request
    req.user = user;
    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const err = new Error('You don\'t have permission to perform this action.');
            err.statusCode = 403
            err.status = 'failure'
            return next(err)
        }

        next()
    }
}