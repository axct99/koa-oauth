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
          vk: !ctx.user.auth.vk
            ? `https://oauth.vk.com/authorize` +
              `?client_id=${process.env.VK_APP_CLIENT_ID}` +
              `&redirect_uri=${host}/signIn/vk` +
              `&display=page&scope=email,offline&v=${process.env.VK_API_VERSION}`
            : '/signOut/vk',
          facebook: '...',
          google: '...'
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
      vk:
        `https://oauth.vk.com/authorize` +
        `?client_id=${process.env.VK_APP_CLIENT_ID}` +
        `&redirect_uri=${host}/signIn/vk` +
        `&display=page&scope=email,offline&v=${process.env.VK_API_VERSION}`,
      facebook: '...',
      google: '...'
    }
  });
});

// get access token by code (redirect_uri)
router.get('/signIn/:type', async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`;
  const { type } = ctx.params;
  const { code } = ctx.query;

  if (!code) return (ctx.status = 400);

  if (type == 'vk') {
    const res = await axios.get(
      `https://oauth.vk.com/access_token` +
        `?client_id=${process.env.VK_APP_CLIENT_ID}` +
        `&client_secret=${process.env.VK_APP_CLIENT_SECRET}` +
        `&redirect_uri=${host}/signIn/vk` +
        `&code=${code}`
    );

    const { access_token, expires_in, user_id, email } = res.data;

    if (!(access_token && user_id)) return ctx.redirect('/');
    else {
      // find user by access token and user id
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
      } else if (ctx.user) {
        // update user
        await User.findOneAndUpdate(
          {
            _id: ctx.user._id
          },
          {
            auth: {
              vk: {
                accessToken: access_token,
                userId: user_id
              }
            }
          }
        ).exec();
      }

      // add user's session
      userSession = await new UserSession({
        user: user._id
      }).save();

      ctx.cookies.set('userSessionToken', userSession.token);
      return ctx.redirect('/');
    }
  }
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

  if (type == 'vk') {
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
