const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const orderController = require('../../controller/user/orderController.js')


const router = express.Router()

router.route('/placeOrder')
    .post(orderController.orderPost)

router.route('/orderSuccess')
    .get(middleware.checkSession, orderController.orderSuccess)

router.route('/orders')
    .get(middleware.checkSession, orderController.orderPage)

router.route('/orderDetail/:orderId')
    .get(middleware.checkSession, orderController.orderDetailPage)

router.route('/cancel')
    .post(orderController.cancelOrder)

router.route('/return')
    .post(orderController.returnOrder)

module.exports = router