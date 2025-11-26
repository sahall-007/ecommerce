const express = require('express')
const userController = require('../../controller/user/userController.js');
const allProducctController = require('../../controller/user/allProductController.js')
const middleware = require('../../middlewares/userAuth.js')
const passport = require('passport');
const forgotPassController = require('../../controller/user/forgotPassController.js')
const searchController = require('../../controller/user/searchController.js');
const profileController = require('../../controller/user/profileController.js')
const addressController = require('../../controller/user/addressController.js')
const uploads = require('../../middlewares/multer.js')

const router = express.Router()

router.route('/address')
    .get(middleware.checkSession, addressController.addressPage)
    .post(addressController.addressPost)

router.route('/selectAddress')
    .post(addressController.selectAddress)

router.route('/deleteAddress')
    .post(addressController.deleteAddress)

router.route('/editAddress/:index/:addressId')
    .get(addressController.editAddressPage)

router.route('/editAddress')
    .patch(addressController.editAddressPatch)


module.exports = router