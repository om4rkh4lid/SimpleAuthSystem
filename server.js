const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv').config()
const app = express();
const auth = require('./controllers/authController');
const mongoose = require('mongoose');
const globalErrorHandler = require('./utils/errorHandler');
const userRouter = require('./routers/userRouter')

const DB_URI = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
const DB = mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true
  }).then(() => {
    console.log('Successfully connected to MongoDB');
  });


// Parse body data
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// Logging in development mode
if(process.env.NODE_ENV === 'development') {
    app.use(morgan("dev"))
}

app.post('/signup', auth.signup);
app.post('/login', auth.login);

app.use('/api/v1/users', userRouter)

// For unimplemented routes and methods
app.all('*', (req, res, next) => {
    const error = new Error(`The endpoint (${req.method} ${req.originalUrl}) doesn't exist.`)
    error.statusCode = 400
    error.status = 'failure'
    next(error) // or throw error
})

// Global error handler for errors that are thrown and not caught
app.use(globalErrorHandler)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`)
})