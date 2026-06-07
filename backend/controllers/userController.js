import asyncHandler from "express-async-handler";
import User from "./../models/userModel.js";
import generateToken from "../utils/generateToken.js";

const authUser = asyncHandler(async (req, res) => {
  console.log('Login attempt received:', { email: req.body.email });
  let { email, password } = req.body;
  email = email?.trim().toLowerCase();

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }
  
  try {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    console.log('User found:', user ? 'Yes' : 'No');

    if (user && (await user.matchPassword(password))) {
      console.log('Password match: Yes');
      generateToken(res, user._id);

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: "User Successfully login with role: " + user.role,
      });
    } else {
      console.log('Password match: No or user not found');
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'ValidationError') {
      res.status(400);
      throw new Error("Invalid data provided");
    }
    throw error;
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, password, role } = req.body;
  let email = req.body.email;
  email = email?.trim().toLowerCase();

  // Validate required fields
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const userExist = await User.findOne({ email });

  if (userExist) {
    res.status(400);
    throw new Error("User Already Exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "User Successfully created with role: " + user.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid User Data");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: isProduction ? true : false,
    sameSite: "None",
    expires: new Date(0),
  });
  res.status(200).json({ message: "User logged out successfully" });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };
  res.status(200).json(user);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error("User Not Found");
  }
});
export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
