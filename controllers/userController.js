const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.search = catchAsync(async (req, res, next) => {

    console.log(req.query)

    // return empty if no query or query is empty
    if (!req.query.q || !req.query.q.trim()) {
        let err = new Error('You need to specify a search string.')
        err.status = 'failure'
        err.statusCode = 404
        return next(err)
    }

    // search the database
    let searchRegx = new RegExp(`${req.query.q}`)
    let users = await User
        .find({ username: { $regex: searchRegx, $options: 'i' } })
        .select('username role')

    res.status(200).json({
        users
    });
})