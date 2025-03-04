const express = require("express");
const router = express.Router();
const users = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const jwtIsLoggedMiddleware = require("../middleware/jwtIsLoggedMiddleware");
const mongoose = require("mongoose")

// Registering new user
router.post("/register", async (req, res) => {
  try {
    
    // Get all the details of user
    const { name, email, password } = req.body;

    // Check if all details are present
    if (!(name && email && password)) {
      res
        .status(400)
        .json({ success: false, error: "All details not provided." });
      return;
    }
    
    //Check if user already exists
    const user = await users.findOne({ email });
    if (user) {
      res.status(400).json({
        message: "Email already registered.",
      });
      return;
    }

    // Hash passsword and store user
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new users({ name, email, password: hashPassword });
    await newUser.save();

    res.status(201).json({ status: 201, success: true, message: "User Registered." });
  } catch (error) {
    res.json({
      success: false,
      error: error.name,
      message: error.message,
    });
  }
});

// Login User (if not already logged in)
router.post("/login", jwtIsLoggedMiddleware, async (req, res) => {
  // Get credentials
  try {
    const { email, password } = req.body;

    // If not all credentials
    if (!(email && password)) {
      res
        .status(400)
        .json({ success: false, message: "All details not provided." });
      return;
    }

    const user = await users.findOne({ email });
    
    // if user does not exists
    if (!user) {
      res.status(400).json({ success: false, message: "User not registered." });
      return;
    }

    // Password validation and token generation
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ _id: user._id ,email:user.email}, process.env.JWT_PRIVATE_KEY, {
        expiresIn: "10m",
      });
      res
        .status(200)
        .cookie("token", token, { httpOnly: true })
        .json({ success: true, token, message: "Logged In" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Credentials not correct. " });
    }

  } catch (error) {
        console.log(error)
    res.status(400).json({ success: false, message: "Login Failed" });
  }
});

// Logout user 
router.get("/logout", (req, res) => {
  try {
    // Check if cookies are present
    if (req.cookies.token) {
      
      // Clear cookies and logout
      res.clearCookie("token");
      res.status(200).json({ success: true, message: "Successfully Logout.." });
    } else {

      // User is not logged in
      res.status(400).json({ success: false, message: "User not logged in." });
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports=router

