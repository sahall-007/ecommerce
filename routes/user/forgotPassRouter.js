const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const forgotPassController = require('../../controller/user/forgotPassController.js')

const router = express.Router()


router.route('/forgotPassword')
    .get(forgotPassController.forgotPassPage)

router.route('/forgotEmailValidation')
    .post(forgotPassController.forgotEmailValidation)

router.route('/forgotOtp')
    .get(forgotPassController.otpPage)
    .post(forgotPassController.otpPost)

router.route('/changePassword')
    .get(forgotPassController.changePassword)
    .post(forgotPassController.changePasswordPost)

router.route('/forgotResendOtp')
    .post(forgotPassController.forgotResendOtp)


module.exports = router