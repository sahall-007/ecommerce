

const express = require('express')
const couponController = require('../../controller/admin/couponController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()



router.route('/addCoupon')
    .get(middleware.checkSession, couponController.addCouponPage)
    .post(middleware.checkSession, couponController.addCouponPost)

router.route('/coupon')
    .get(middleware.checkSession, couponController.couponManagement)

router.route('/coupon/:page')
    .get(middleware.checkSession, couponController.pagination)

router.route('/editCoupon/:couponId')
    .get(middleware.checkSession, couponController.editCouponPage)
    .post(middleware.checkSession, couponController.editCouponPost)


router.route('/blockCoupon')
    .patch(middleware.checkSession, couponController.blockCoupon)

router.route('/unBlockCoupon')
    .patch(middleware.checkSession, couponController.unBlockCoupon)

module.exports = router