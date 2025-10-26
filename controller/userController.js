
const userSchema = require('../model/userSchema.js')
const bcrypt = require('bcrypt')

const salt = 10


const loadRegister = async (req, res) => {
    try {
        res.render('register')
    }
    catch (err) {
        console.log(err)
        console.log("failed to load the register page!")
    }
}

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body

        const user = await userSchema.findOne({ username })

        if (user) {
            throw new Error("user already exist")
        }

        const hashedPassword = await bcrypt.hash(password, salt)

        const newuser = await new userSchema({
            username,
            email,
            password: hashedPassword
        })

        await newuser.save()

        res.redirect('/login')

    }
    catch (err) {
        console.log(err)
        console.log("failed to register the user!")
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('login')
    }
    catch (err) {
        console.log(err)
        console.log("failed to load the login page!")
    }
}

module.exports = {
    loadRegister,
    registerUser,
    loadLogin
}