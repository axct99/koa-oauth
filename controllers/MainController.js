const axios = require('axios')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

// main page
exports.index = async (ctx, next) => {
  const { user } = ctx
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`

  await ctx.render('index', {
    user,
    urls: {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${host}/link/google&response_type=code&scope=email`,
      vk: `https://oauth.vk.com/authorize?client_id=${process.env.VK_CLIENT_ID}&redirect_uri=${host}/link/vk&display=page&scope=email&v=${process.env.VK_API_VERSION}`,
      facebook: ''
    }
  })

  next()
}

// link account (get access token by code)
exports.link = async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`
  const { type } = ctx.params
  const { code } = ctx.query

  if (!code) return (ctx.status = 400)

  if (type == 'google') {
    const res = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${host}/link/google`,
      code: code,
      grant_type: 'authorization_code'
    })

    const { access_token, id_token } = res.data

    const res2 = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      params: {
        access_token
      }
    })

    const { sub } = res2.data

    if (!(access_token && sub)) return ctx.redirect('/')
    else {
      // find user by user id
      let user = ctx.user
        ? ctx.user
        : await User.findOne({
          'auth.google.userId': sub
        }).exec()

      if (!user) {
        // if user doesn't exist create it
        user = await new User({
          auth: {
            google: {
              accessToken: access_token,
              userId: sub
            }
          }
        }).save()
      } else {
        // update user
        await User.findOneAndUpdate(
          {
            _id: user._id
          },
          {
            'auth.google': {
              accessToken: access_token,
              userId: sub
            }
          }
        ).exec()
      };

      // generate jwt token
      accessToken = jwt.sign({
        token: user.authToken
      }, process.env.JWT_SECRET, { expiresIn: '1d' })

      // set cookies
      ctx.cookies.set('accessToken', accessToken)
    };
  } else if (type == 'vk') {
    const res = await axios.get('https://oauth.vk.com/access_token', {
      params: {
        client_id: process.env.VK_CLIENT_ID,
        client_secret: process.env.VK_CLIENT_SECRET,
        redirect_uri: `${host}/link/vk`,
        code: code
      }
    })

    const { access_token, expires_in, user_id, email } = res.data

    if (!(access_token && user_id)) return ctx.redirect('/')
    else {
      // find user by user id
      let user = ctx.user
        ? ctx.user
        : await User.findOne({
          'auth.vk.userId': user_id
        }).exec()

      if (!user) {
        // if user doesn't exist create it
        user = await new User({
          auth: {
            vk: {
              accessToken: access_token,
              userId: user_id
            }
          }
        }).save()
      } else if (ctx.user) {
        // update user
        await User.findOneAndUpdate(
          {
            _id: user._id
          },
          {
            'auth.vk': {
              accessToken: access_token,
              userId: user_id
            }
          }
        ).exec()
      }

      // generate jwt token
      accessToken = jwt.sign({
        token: user.authToken
      }, process.env.JWT_SECRET, { expiresIn: '1d' })

      // set cookies
      ctx.cookies.set('accessToken', accessToken)
    }
  } else if (type == 'facebook') {
    // ...
  };

  return ctx.redirect('/')
}

// sign out
exports.signOut = async (ctx, next) => {
  // clear cookie
  ctx.cookies.set('accessToken', '')

  ctx.redirect('/')
}

// unlink account
exports.unlink = async (ctx, next) => {
  const { user } = ctx
  const { type } = ctx.params

  if (!user) return ctx.redirect('/')

  if (type == 'google') {
    // delete google auth
    await User.findOneAndUpdate(
      {
        _id: user._id
      },
      {
        'auth.google': null
      }
    ).exec()
  } else if (type == 'vk') {
    // delete vk auth
    await User.findOneAndUpdate(
      {
        _id: user._id
      },
      {
        'auth.vk': null
      }
    ).exec()
  }

  ctx.redirect('/')
}
