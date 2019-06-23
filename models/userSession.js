const mongoose = require('mongoose');
const randtoken = require('rand-token');

// User's session
const UserSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    useTime: {
      type: Date,
      default: Date.now
    },
    expiryTime: {
      type: Date,
      default: Date.now
    },
    token: {
      type: String,
      required: true,
      default: () => {
        return randtoken.generate(64);
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'UserSession',
  UserSessionSchema,
  'userSessions'
);
