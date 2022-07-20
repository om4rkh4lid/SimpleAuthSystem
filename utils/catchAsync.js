module.exports = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch( err => {
            res.status(400)
            .json({
                name: err.name,
                message: err.message
            })
        })
    }
}