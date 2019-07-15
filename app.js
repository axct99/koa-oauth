const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const User = require('./models/user')

// error handler
onerror(app)

// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
)
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(
  views(__dirname + '/views', {
    extension: 'ejs',
    options: {}
  })
)

// db
if (process.env.NODE_ENV === 'development') mongoose.set('debug', true)
mongoose.connection
  .on('error', error => console.error(e))
  .on('close', () => console.log('Database connection closed.'))
  .once('open', () => console.log('Database connection opened.'))
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// authonification by session token
app.use(async (ctx, next) => {
  // get access token from cookies
  const accessToken = ctx.cookies.get('accessToken')

  if (accessToken) {
    // verify JWT
    try {
      var { token } = jwt.verify(accessToken, process.env.JWT_SECRET)
      // find user by access token
      if (token) ctx.state.user = ctx.user = await User.findOne({ authToken: token }).exec()
    } catch (err) {
      ctx.cookies.set('accessToken', '')
      return await ctx.redirect('/')
    }
  }

  await next()
})

// routes
app.use(require('./routes/').routes())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

module.exports = app
