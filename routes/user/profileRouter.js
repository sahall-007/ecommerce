const express = require('express')
const userController = require('../../controller/user/userController.js');
const allProducctController = require('../../controller/user/allProductController.js')
const middleware = require('../../middlewares/userAuth.js')
const passport = require('passport');
const forgotPassController = require('../../controller/user/forgotPassController.js')
const searchController = require('../../controller/user/searchController.js');
const profileController = require('../../controller/user/profileController.js')
const uploads = require('../../middlewares/multer.js')

const router = express.Router()



router.route('/profile')
    .get(middleware.checkSession, profileController.profilePage)

router.route('/editProfile')
    .post(middleware.checkSession, profileController.editProfile)

// change email ---------------
router.route('/changeEmail')
    .get(profileController.changeEmailPage)
    .post(profileController.changeEmailPost)

router.route('/changeEmailOtp')
    .get(profileController.getOtpPage)
    .post(profileController.otpPost)

router.route('/changeEmailresendOtp')    
    .post(profileController.changeEmailresendOtp)

router.route('/newEmail')
    .get(profileController.newEmailPage)
    .post(profileController.newEmailPost)

router.route('/newEmailOtp')    
    .get(profileController.newEmailOtpPage)
    .post(profileController.newEmailOtpPost)

router.route('/newEmailResendOtp')
    .post(profileController.newEmailResendOtp)

// change password
router.route('/updatePassword')
    .post(profileController.updatePassword)

// change profile image
router.route('/profileImage/:id')
    .post(uploads.upload.single('profileImage'), profileController.profileImage)




module.exports = router