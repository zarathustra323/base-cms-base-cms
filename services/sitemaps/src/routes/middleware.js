module.exports = (req, res, next) => {
  const { prefix = '' } = req.params;
  const host = req.get('x-website-host') || req.get('host');
  res.locals.baseUri = `${req.protocol}://${host}${prefix}`;
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Content-Type', 'text/xml');
  next();
};