const express = require("express");
const app = express();
const dotenv = require("dotenv");
const authRouter = require("./routes/auth");
const blogRouter = require("./routes/blog");
const { connectdb } = require("./db");
const cookieParser = require("cookie-parser");
const rateLimiter = require("express-rate-limit");
const jwtVerifyMiddleware = require("./middleware/jwtVerifyMiddleware");

// Environment varibles
dotenv.config();

//Connecting to data base
connectdb();

// Rate limit for requests
const limiter = rateLimiter({
  windowMs: 10 * 1000, // 1-min window for 5 requests
  limit: 5,
  handler: (req, res, next, options) => {
    res.status(429).json({ success: false, message: "Too Many Requests." });
  },
});

// Middlewares
app.use(limiter); // Rate limiting
app.use(express.json()); // For parsing json
app.use(cookieParser()); // For accessing cookies

//Routes
app.use("/auth", authRouter);
app.use("/blog", jwtVerifyMiddleware,blogRouter);

app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.listen(process.env.PORT, () => {
  console.log(`App listning on http://localhost:${process.env.PORT}`);
});
