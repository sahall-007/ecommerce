

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
const addressRouter = require('./addressRouter.js')
const cartRouter = require('./cartRouter.js')
const checkoutRouter = require('./checkoutRouter.js')
const orderRouter = require('./orderRouter.js')
const invoiceRoute = require('./invoice.js')
const wishlistRouter = require('./wishlistRouter.js')

const router = express.Router()

// home page
// router.route('/')
//     .get(middleware.checkSession, userController.getHomePage)

// user authentication
router.route('/register')
    .get(middleware.hasSession, userController.loadRegister)
    .post(userController.registerUser)

router.route('/login')
    .get(middleware.hasSession, userController.loadLogin)
    .post(userController.loginPost)
    
// 404 page not found
// router.route('/pageNotFound')
//     .get(userController.pageNotFound)



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
router.use(addressRouter)

// cart --------------------------------
router.use(cartRouter)

// checkout --------------------------------
router.use(checkoutRouter)

// order ------------------------------
router.use(orderRouter)

// invoice ------------------------------
router.use(invoiceRoute)

// wishlist -----------------------------------
router.use(wishlistRouter)



module.exports = router