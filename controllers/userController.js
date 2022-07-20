const catchAsync = require('../utils/catchAsync');

exports.search = catchAsync(async (req, res, next) => {
    res.status(200).json({
        message: "Well done, it's here!"
    });
})