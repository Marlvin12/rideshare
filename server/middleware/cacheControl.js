const cacheControl = (visibility = 'public', maxAgeSeconds = 60) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `${visibility}, max-age=${maxAgeSeconds}`);
    } else {
      res.set('Cache-Control', 'no-store');
    }
    next();
  };
};

export default cacheControl;
