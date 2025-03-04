// This middleware is used to check if the user is logged in or not.
const jwt = require('jsonwebtoken')

// Middleware
const jwtIsLoggedMiddleware = (req,res,next)=>{
  try {
    const token = req.cookies.token
    const data = jwt.verify(token, process.env.JWT_PRIVATE_KEY)
    res.status(400).json({success:false,message:"User already logged in."})
  } catch (e) {
    console.log(e,e.name,e.message)
    res.clearCookie("token")
    next()
  }
}
module.exports = jwtIsLoggedMiddleware
