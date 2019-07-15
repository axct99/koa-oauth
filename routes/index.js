const router = require('koa-router')()

const MainController = require('../controllers/MainController')

const checkAuth = async (ctx, next) => {
  if (!ctx.user) await ctx.redirect('/')
  else await next()
}

// main page (sign in)
router.get('/', MainController.index)

// sign out
router.get('/signOut', checkAuth, MainController.signOut)

// linking
router.get('/link/:type', MainController.link)
router.get('/unlink/:type', checkAuth, MainController.unlink)

module.exports = router
