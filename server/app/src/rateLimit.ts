import rateLimit from 'express-rate-limit'

const WINDOW_MS = 15 * 60 * 1000

export const publicIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})

export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})