const mongoose = require('mongoose');
const randtoken = require('rand-token');

// User's authentication
const UserAuthSchema = new mongoose.Schema({
	user: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User',
		required: true
	},
	type: {
		type: Number,
		required: true,
		enum: [1,2,3]
	},
	accessToken: {
		type: String,
		required: true
	}
}, {
	timestamps: true
});

module.exports = mongoose.model('UserAuth', UserAuthSchema, 'userAuths');