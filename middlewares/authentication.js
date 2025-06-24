const { validateToken } = require("../services/authentication");

function checkForAuthentication() {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies.token;
    if (!tokenCookieValue) {
      return next();
    }
    try {
      const userPayload = validateToken(tokenCookieValue);
      req.user = userPayload;
    } catch (error) {}
    return next();
  };
}

// middleware/auth.js

module.exports = {
  checkForAuthentication,
};
