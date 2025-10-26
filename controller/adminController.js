
const adminService = require('../service/adminService.js')


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

        const result = await adminService.adminVerify({name, email, password})

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


module.exports = {
    loadLogin,
    loginVerify,
    loadDashboard
}