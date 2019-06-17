const mongoose = require('mongoose');

// User
const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		lowercase: true,
		maxlength: 250
	}
}, {
	timestamps: true
});

module.exports = mongoose.model('User', UserSchema, 'users');