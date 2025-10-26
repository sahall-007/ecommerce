
const userService = require('../service/userService.js')


const loadRegister = async (req, res) => {
    try{
        res.render('register')
    }
    catch(err){
        console.log(err)
        console.log("failed to load the register page!")
    }
}

const registerUser = async (req, res) => {
    try{
        const { username, email, password } = req.body

        const result = await userService.registerUserService({username, email, password})

        res.redirect('/login')

    }
    catch(err){
        console.log(err)
        console.log("failed to register the user!")
    }
}

const loadLogin = async (req, res) => {
    try{
        res.render('login')
    }
    catch(err){
        console.log(err)
        console.log("failed to load the login page!")
    }
}

module.exports = {
    loadRegister,
    registerUser,
    loadLogin
}