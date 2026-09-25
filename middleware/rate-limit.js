const buckets = new Map();

function rateLimit({ windowMs = 60 * 1000, max = 100 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return next();
    }
    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', String(Math.ceil((windowMs - (now - current.startedAt)) / 1000)));
      return res.status(429).send('Maombi mengi sana. Jaribu tena baada ya muda mfupi.');
    }
    next();
  };
}

module.exports = rateLimit;
