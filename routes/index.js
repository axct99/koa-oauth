const router = require('koa-router')();
const axios = require('axios');

const User = require('../models/user');
const UserSession = require('../models/userSession');

// main page
router.get('/', async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`;

  await ctx.render('index', {
    user: null,
    urls: ctx.user
      ? {
          google: !ctx.user.auth.google
            ? 'https://accounts.google.com/o/oauth2/v2/auth' + 
              `?client_id=${process.env.GOOGLE_CLIENT_ID}` + 
              `&redirect_uri=${host}/signIn/google` + 
              `&response_type=code&scope=email`
            : '/signOut/google',
          vk: !ctx.user.auth.vk
            ? `https://oauth.vk.com/authorize` +
              `?client_id=${process.env.VK_CLIENT_ID}` +
              `&redirect_uri=${host}/signIn/vk` +
              `&display=page&scope=email&v=${process.env.VK_API_VERSION}`
            : '/signOut/vk',
          facebook: !ctx.user.auth.facebook
            ? '' : '/signOut/facebook/',
        }
      : null
  });

  next();
});

// sign in
router.get('/signIn', async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`;

  await ctx.render('signIn', {
    urls: {
      google: 
        'https://accounts.google.com/o/oauth2/v2/auth' + 
        `?client_id=${process.env.GOOGLE_CLIENT_ID}` + 
        `&redirect_uri=${host}/signIn/google` + 
        `&response_type=code&scope=email`,
      vk:
        'https://oauth.vk.com/authorize' +
        `?client_id=${process.env.VK_CLIENT_ID}` +
        `&redirect_uri=${host}/signIn/vk` +
        `&display=page&scope=email&v=${process.env.VK_API_VERSION}`,
      facebook: '...'
    }
  });
});

// get access token by code (redirect_uri)
router.get('/signIn/:type', async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`;
  const { type } = ctx.params;
  const { code } = ctx.query;

  if (!code) return (ctx.status = 400);

  if (type == 'google') {
    const res = await axios.post(
      `https://www.googleapis.com/oauth2/v4/token` +
        `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&client_secret=${process.env.GOOGLE_CLIENT_SECRET}` + 
        `&redirect_uri=${host}/signIn/google` + 
        `&code=${code}` +
        '&grant_type=authorization_code',
    );

    const { access_token, id_token } = res.data;

    const res2 = await axios.post(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

    const { sub } = res2.data;

    if (!(access_token && sub)) return ctx.redirect('/');
    else {
      // find user by user id
      let user = ctx.user
        ? ctx.user
        : await User.findOne({
            'auth.vk.userId': sub
          }).exec();

      if (!user) {
        // if user doesn't exist create it
        user = await new User({
          auth: {
            google: {
              accessToken: access_token,
              userId: sub
            }
          }
        }).save();

        // add user's session
        userSession = await new UserSession({
          user: user._id
        }).save();

        // set cookies
        ctx.cookies.set('userSessionToken', userSession.token);
      } else {
        // update user
        await User.findOneAndUpdate(
          {
            _id: ctx.user._id
          },
          {
            'auth.google': {
              accessToken: access_token,
              userId: sub
            }
          }
        ).exec();
      };
    };
  } else if (type == 'vk') {
    const res = await axios.get(
      `https://oauth.vk.com/access_token` +
        `?client_id=${process.env.VK_CLIENT_ID}` +
        `&client_secret=${process.env.VK_CLIENT_SECRET}` +
        `&redirect_uri=${host}/signIn/vk` +
        `&code=${code}`
    );

    const { access_token, expires_in, user_id, email } = res.data;

    if (!(access_token && user_id)) return ctx.redirect('/');
    else {
      // find user by user id
      let user = ctx.user
        ? ctx.user
        : await User.findOne({
            'auth.vk.userId': user_id
          }).exec();

      if (!user) {
        // if user doesn't exist create it
        user = await new User({
          auth: {
            vk: {
              accessToken: access_token,
              userId: user_id
            }
          }
        }).save();

        // add user's session
        userSession = await new UserSession({
          user: user._id
        }).save();

        // set cookies
        ctx.cookies.set('userSessionToken', userSession.token);
      } else if (ctx.user) {
        // update user
        await User.findOneAndUpdate(
          {
            _id: ctx.user._id
          },
          {
            'auth.vk': {
              accessToken: access_token,
              userId: user_id
            }
          }
        ).exec();
      }
    }
  };
  
  return ctx.redirect('/');
});

// sign out
router.get('/signOut', async (ctx, next) => {
  // clear cookie
  ctx.cookies.set('userSessionToken', '');

  // delete session
  if (ctx.userSession) await ctx.userSession.remove();

  ctx.redirect('/');
});

// sign out from service
router.get('/signOut/:type', async (ctx, next) => {
  const { type } = ctx.params;

  if (type == 'google') {
    // update google
    await User.findOneAndUpdate(
      {
        _id: ctx.user._id
      },
      {
        'auth.google': null
      }
    ).exec();
  } else if (type == 'vk') {
    // update user
    await User.findOneAndUpdate(
      {
        _id: ctx.user._id
      },
      {
        'auth.vk': null
      }
    ).exec();
  }

  ctx.redirect('/');
});

module.exports = router;
