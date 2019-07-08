const mongoose = require('mongoose')

// User
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      maxlength: 250
    },
    auth: {
      type: {
        vk: {
          accessToken: {
            type: String,
            maxlength: 500
          },
          userId: {
            type: Number
          }
        },
        facebook: {
          accessToken: {
            type: String,
            maxlength: 500
          },
          userId: {
            type: Number
          }
        },
        google: {
          accessToken: {
            type: String,
            maxlength: 500
          },
          userId: {
            type: Number
          }
        }
      },
      default: {}
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', UserSchema, 'users')
