
const express = require('express')
const orderController = require('../../controller/admin/orderController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()

router.route('/orders')
    .get(middleware.checkSession, orderController.orderManagement)

router.route('/orderDetail/:orderId')
    .get(middleware.checkSession,  orderController.adminOrderDetailPage)

router.route('/editStatus')
    .post(middleware.checkSession, orderController.editStatus)

router.route('/cancel')
    .post(middleware.checkSession, orderController.cancelOrder)

router.route('/return')
    .post(middleware.checkSession, orderController.returnOrder)

module.exports = router