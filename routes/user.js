

const express = require('express')
const userController = require('../controller/user/userController.js');
const allProducctController = require('../controller/user/allProductController.js')
const middleware = require('../middlewares/userAuth.js')
const passport = require('passport');
const profileController = require('../controller/user/profileController.js')

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

// google sign up    
router.route('/auth/google')
    .get(passport.authenticate('google', {scope: ['profile', 'email']}))

router.route('/auth/google/callback')
    .get(passport.authenticate('google', {failureRedirect: '/register'}), (req, res) => {
        res.redirect('/')
    })

// home page
// router.route('/home')
//     .get(middleware.checkSession, userController.getHomePage)

router.route('/logout')
    .get(userController.logout)


router.route('/productDetail/:id')
    .get(middleware.checkSession, userController.productDetail)

router.route('/allProducts')
    .get(middleware.checkSession, allProducctController.allProducts)

router.route('/filter')
    .get(middleware.checkSession, allProducctController.filterPage)
    .post(allProducctController.filter)

router.route('/search')
    .post(allProducctController.search)

router.route('/allProducts/next')
    .get(allProducctController.nextPage)

router.route('/allProducts/prev')
    .get(allProducctController.prevPage)

// forgot password
router.route('/forgotPassword')
    .get(profileController.forgotPassPage)

router.route('/forgotEmailValidation')
    .post(profileController.forgotEmailValidation)

module.exports = router