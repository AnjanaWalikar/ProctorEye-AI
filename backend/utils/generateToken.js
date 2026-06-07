import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set secure: false for development (localhost), true for production
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction ? true : false,
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
