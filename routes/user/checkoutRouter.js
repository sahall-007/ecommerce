const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const checkoutController = require('../../controller/user/checkoutController.js')

const router = express.Router()

router.route('/checkout')
    .get(middleware.checkSession, checkoutController.checkoutPage)


module.exports = router