

const express = require('express')
const userController = require('../controller/user/userController.js');
const middleware = require('../middlewares/userAuth.js')
const passport = require('passport');

const router = express.Router()

router.get('/', (req, res) => {
    res.json({ message: "App has started to work!!!" });
})

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
        res.redirect('/home')
    })

// home page
router.route('/home')
    .get(userController.getHomePage)

router.route('/logout')
    .get(userController.logout)


router.route('/productDetail/:id')
    .get(userController.productDetail)

module.exports = router