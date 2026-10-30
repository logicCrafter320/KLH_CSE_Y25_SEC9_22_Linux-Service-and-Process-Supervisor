const auth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid API key'
    });
  }

  next();
};

module.exports = auth;