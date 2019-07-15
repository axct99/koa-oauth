const request = require('supertest')
const server = require('../bin/www')

describe('routes', () => {
  test('GET /', async () => {
    const res = await request(server).get('/')
    expect(res.status).toBe(200)
  })

  test('GET /link/google', async () => {
    const res = await request(server).get('/link/google')
    expect(res.status).toEqual(400)
  })
  test('GET /unlink/google', async () => {
    const res = await request(server).get('/unlink/google')
    expect(res.status).toEqual(302)
  })
})
