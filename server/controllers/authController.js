import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import validateInput from "../utils/validation.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const errors = validateInput(req.body, ["name", "email", "password"]);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (role && !["jobseeker", "recruiter"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = validateInput(req.body, ["email", "password"]);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};