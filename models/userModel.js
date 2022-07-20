const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'You need a username to be able to register'],
        unique: [true, 'This username is already taken, please choose another'],
        minlength: [3, 'Your username needs to be at least 3 characters long '],
    },
    password: {
        type: String,
        required: [true, 'You need a password to be able to register'],
        minlength: [8, 'Your password needs to be at least 8 characters long.'],
        // Don't include it in find() queries
        select: false 
    },
    passwordConfirm: {
        type: String,
        required: [true, 'You need to confirm the password to be able to register'],
        validate: {
            // This only works on CERATE and SAVE. Doesn't work on findOneAndUpdate()
            validator: function(field) {
                return field === this.password
            },
            message: 'Both passwords need to be the same.'
        }
    },
    passwordChangedAt: Date
})

// Encrypt the password before it's persisted to the database
userSchema.pre('save', async function(next){
    // Do nothing if the password has not been modified
    if (!this.isModified('password')) return next()
    // Otherwise salt and hash the password using bcrypt with cost 12
    this.password = await bcrypt.hash(this.password, 12)
    // set passwordConfirm to undefined to remove it from the document that will be saved in the database 
    // even though it's required this is possible because it was provided to the create function
    this.passwordConfirm = undefined
})

// Instance method (available on all User documents)
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    // this refers to the current document, but it doesn't have the password since we set select to false.
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
    if (this.passwordChangedAt) {
        // if this field exists then the password has changed at least once
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10) 
        return JWTTimeStamp < changedTimeStamp // if this is true then the password has changed after the timestamp has been issued 
    }

    // Password has not changed
    return false
}

const User = mongoose.model('User', userSchema);

module.exports = User;