const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
router.post("/register",async (req,res) => {
    try {
        const {username,password} = req.body;

        //validation of the user 
        if (!username || username.trim().length < 3) {
            return res.status(400).json({
                message:"Username must be at least 3 characters"
            });
        }
        if(username.length > 20){
            return res.status(400).json({
                message:"Username must be max 20 characters"
            });
        }
        if(password.length > 128){
            return res.status(400).json({
                message:"Password must be max 6 - 128 characters"
            })
        }
        if(!password || password.length < 6){
            return res.status(400).json({
                message:"Password must be at least 6 characters"
            });;
        }
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
});

module.exports = router;