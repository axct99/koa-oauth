const router = require('koa-router')();
const axios = require('axios');

// Main page
router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    user: null
  });
});

// Sign In
router.get('/signIn', async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`;

  await ctx.render('signIn', {
    urls: {
      vk: `https://oauth.vk.com/authorize` +
          `?client_id=${process.env.VK_APP_CLIENT_ID}` +
          `&redirect_uri=${host}/signIn/vk` +
          `&display=page&scope=email,offline&v=${process.env.VK_API_VERSION}`,
      facebook: '...',
      google: '...'
    }
  });
});

// Get access token by code
router.get('/signIn/:type', async (ctx, next) => {
  const host = `${ctx.request.protocol}://${ctx.request.get('host')}`;
  const { type } = ctx.params;
  const { code } = ctx.query;
  
  if (!code) return ctx.status = 400;

  if (type == 'vk') {
    try {
      const res = await axios.get(
        `https://oauth.vk.com/access_token` + 
        `?client_id=${process.env.VK_APP_CLIENT_ID}` +
        `&client_secret=${process.env.VK_APP_CLIENT_SECRET}` +
        `&redirect_uri=${host}/signIn/vk` + 
        `&code=${code}`
      );

      const { access_token, expires_in, user_id } = res.data;

      if (access_token && user_id) {
        // ...
        ctx.redirect('/');
      };
    } catch (e) {
      console.error(e);
    };
  };
});

// Sign Out
router.get('/signOut', async (ctx, next) => {
  ctx.body = 'SIGN OUT'
});

module.exports = router;
