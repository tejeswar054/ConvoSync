const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
router.post("/register",async (req,res) => {
    try {
        const {username,password} = req.body;

        // check existing user
        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(400).json({
                message: "User already exist"
            });
        }

        // hash password
        const hashPassword = await bcrypt.hash(password,10);

        // create user
        const newUser = await User.create({
            username,
            password: hashPassword
        });
        res.status(201).json({
            message: "User registered successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }

});

router.post("/login",async (req,res) => {
    try {
        const {username,password} = req.body;

        // find user
        const user = await User.findOne({username});
        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // compare password
        const isMatch = await bcrypt.compare(
            password, 
            user.password
        );

        if(!isMatch){
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // generate token
        const token = jwt.sign(
            {
                userId:user._id,
                username:user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn : "7d"
            }
        );
        res.status(200).json({
            message: "Login successful",
            token
        });
    } catch (error){
        res.status(500).json({
            message: "Server error"
        });
    }
}),

module.exports = router;