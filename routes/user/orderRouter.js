const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const orderController = require('../../controller/user/orderController.js')
const uploads = require('../../middlewares/multer.js')

const stripe = require('../../config/stripe.js')


const router = express.Router()

router.route('/placeOrder')
    .post(orderController.orderPost)

router.route('/orderSuccess')
    .get(middleware.checkSession, orderController.orderSuccess)

router.route('/orderFail')
    .get(middleware.checkSession, orderController.orderFail)

router.route('/orders')
    .get(middleware.checkSession, orderController.orderPage)

router.route('/orders/:page')
    .get(middleware.checkSession, orderController.pagination)

router.route('/orders/search')
    .get(middleware.checkSession, orderController.orderPage)

router.route('/orderDetail/:orderId')
    .get(middleware.checkSession, orderController.orderDetailPage)

router.route('/cancel')
    .post(orderController.cancelOrder)

router.route('/return')
    .post(uploads.upload.single('returnImage'), orderController.returnOrder)

router.route('/create-checkout-session')
    .post(middleware.checkSession, orderController.checkSession)

router.route('/searchOrder')
    .post(middleware.checkSession, orderController.searchOrder)


module.exports = router