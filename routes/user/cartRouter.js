

const express = require('express')
const userController = require('../../controller/user/userController.js');
const allProducctController = require('../../controller/user/allProductController.js')
const middleware = require('../../middlewares/userAuth.js')
const passport = require('passport');
const forgotPassController = require('../../controller/user/forgotPassController.js')
const searchController = require('../../controller/user/searchController.js');
const cartController = require('../../controller/user/cartController.js')

const profileRouter = require("./profileRouter.js")
const googelRouter = require("./googleRouter.js")
const forgotPassRouter = require("./forgotPassRouter.js")
const userPageRouter = require("./userPageRouter.js")
const addressRouter = require('./addressRouter.js')

const router = express.Router()

router.route('/cart')
    .get(cartController.cartPage)
    .post(cartController.cartPost)

router.route('/updateQuantity')
    .patch(cartController.updateQuantity)

router.route('/removeProduct')
    .patch(cartController.removeProduct)

module.exports = router