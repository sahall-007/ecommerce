

const express = require('express')
const couponController = require('../../controller/admin/couponController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()



router.route('/addCoupon')
    .get(couponController.addCouponPage)
    .post(couponController.addCouponPost)

router.route('/coupon')
    .get(couponController.couponManagement)

module.exports = router