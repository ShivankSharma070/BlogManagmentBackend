// This middleware verifies the user by checking if he has a valid token or not
const jwt = require("jsonwebtoken");

// Middleware
const jwtVerifyMiddleware = (req, res, next) => {
  // Extract token, if present
  let token;
  if (req.cookies.token) {
    token = req.cookies.token;
  } else {
    res.status(400).json({ success: false, message: "User not logged in." });
    return;
  }
  try {

    // Verify token
    const data = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.user = data;
    // next route/middleware
    next();
  } catch (e) {
    // Clear cookies
    res.clearCookie("token");

    //If token has expired
    if (e.name == "TokenExpiredError") {
      res
        .status(401)
        .json({
          success: false,
          error:e.name,
          message: "Authentication token expired. Login Again",
        });
    } 

    // If token is invalid or any other cause
    else {
      res
        .status(401)
        .json({
          success: false,
          error:e.name,
          message: "Authentication token invalid. Login Again",
        });
    }
  }
};
module.exports = jwtVerifyMiddleware;
