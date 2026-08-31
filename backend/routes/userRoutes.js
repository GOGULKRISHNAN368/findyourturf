const express = require("express");
const User = require("../models/User");

const router = express.Router();

// CREATE USER
router.post("/", async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                message: "Name, email and phone are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const user = new User({
            name,
            email,
            phone
        });

        const savedUser = await user.save();

        res.status(201).json({
            message: "User created successfully",
            user: savedUser
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// GET ALL USERS
router.get("/", async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// GET USER BY ID
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;