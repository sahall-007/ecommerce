

const { connect } = require('mongoose')
const adminSchema = require('../../model/adminSchema.js')
const bcrypt = require("bcrypt")
// const userSchema = require('../../model/userSchema.js')


const loadLogin = async (req, res) => {
    try{
        res.status(200).render('login')
    }
    catch(err){
        console.log(err)
        console.log("failed to load the login page!")
        res.status(500).json({messge: "something went wrong (admin login page)"})
    }
}

const loginVerify = async (req, res) =>{
    try{
        const { email, password } = req.body

        console.log(email, password)

        const admin = await adminSchema.findOne({ email })

        if(!admin){
            return res.status(404).json({success: false, message: "email not found in the database"})
        }

        const isMatch = await bcrypt.compare(password, admin.password)

        if (!isMatch || admin.email !== email) {
            console.log("inside condition")
            return res.status(401).json({success: false, message: "invalid email or password !"})
        }

        req.session.admin = true
console.log("session created")
        res.status(200).redirect('/admin/dashboard')

    }
    catch(err){
        console.log(err)
        console.log("failed to login  !")
    }
}

const loadDashboard = async (req, res) => {
    try{
        res.render('adminHome')
    }
    catch(err){
        console.log(err)
        console.log("failed to load admin dashboard!")
    }
}

const logout = async (req, res) => {
    try{
        req.session.admin = null
        res.redirect('/admin/login')
    }
    catch(err){
        console.log(err)
        console.log("failed to logout")
        res.status(500).json({success: false, message: "somwthing went wrong (admin logout)"})
    }
}


module.exports = {
    loadLogin,
    loginVerify,
    loadDashboard,
    logout
}