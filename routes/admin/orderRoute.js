
const express = require('express')
const orderController = require('../../controller/admin/orderController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()

router.route('/orders')
    .get(middleware.checkSession, orderController.orderManagement)

router.route('/orders/:page')
    .get(middleware.checkSession, orderController.pagination)

router.route('/orderDetail/:orderId')
    .get(middleware.checkSession,  orderController.adminOrderDetailPage)

router.route('/editStatus')
    .post(middleware.checkSession, orderController.editStatus)

router.route('/cancel')
    .post(middleware.checkSession, orderController.cancelOrder)

router.route('/return')
    .post(middleware.checkSession, orderController.returnOrder)

router.route('/rejectRequest')
    .post(middleware.checkSession, orderController.rejectRequest)
// router.route('/returnStatusUpdate')
//     .post(middleware.checkSession, orderController.editStatus)


module.exports = router