const mongoose = require('mongoose')
const randtoken = require('rand-token')

// User
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      maxlength: 250
    },
    authToken: {
      type: String,
      required: true,
      default: () => {
        return randtoken.generate(64)
      }
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

UserSchema.virtual('authCount').get(function () {
  return Object.values(this.auth)
})

module.exports = mongoose.model('User', UserSchema, 'users')
