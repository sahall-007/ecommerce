

const express = require('express')
const userController = require('../../controller/user/userController.js');
const allProducctController = require('../../controller/user/allProductController.js')
const middleware = require('../../middlewares/userAuth.js')
const passport = require('passport');
const forgotPassController = require('../../controller/user/forgotPassController.js')
const searchController = require('../../controller/user/searchController.js');

const profileRouter = require("./profileRouter.js")
const googelRouter = require("./googleRouter.js")
const forgotPassRouter = require("./forgotPassRouter.js")
const userPageRouter = require("./userPageRouter.js")
// const addressRouter = require('./addressRouter.js')

const router = express.Router()

router.route('/')
    .get(middleware.checkSession, userController.getHomePage)

router.route('/register')
    .get(middleware.hasSession, userController.loadRegister)
    .post(userController.registerUser)

router.route('/login')
    .get(middleware.hasSession, userController.loadLogin)
    .post(userController.loginPost)
    
// otp 
router.route('/otp')
    .get(middleware.hasSession, userController.loadOtpPage)
    .post(userController.verifyOtp)

router.route('/resendOtp')
    .post(userController.resendOtp)

// google sign up  --------------------------------
router.use(googelRouter)

// home page
router.use(userPageRouter)

// forgot password --------------------------------
router.use(forgotPassRouter)

// profile --------------------------------
router.use(profileRouter)

// address --------------------------------
// router.use(addressRouter)



module.exports = router