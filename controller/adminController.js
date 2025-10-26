

const adminSchema = require('../model/adminSchema.js')
const userSchema = require('../model/userSchema.js')


const loadLogin = async (req, res) => {
    try{
        res.render('login')
    }
    catch(err){
        console.log(err)
        console.log("failed to load the login page!")
    }
}

const loginVerify = async (req, res) =>{
    try{
        const { name, email, password } = req.body

        const admin = await adminSchema.findOne({ name })
        console.log(admin)
        if(!admin){
            throw new Error("wrong credentials")
        }

        res.redirect('/admin/dashboard')

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

const loadUserManagement = async (req, res) => {
    try{
        const users = await userSchema.find()
    }
    catch(err){
        console.log(err)
        console.log("failed to load user management page")
    }
}


module.exports = {
    loadLogin,
    loginVerify,
    loadDashboard
}