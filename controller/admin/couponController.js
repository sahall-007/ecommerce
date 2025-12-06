
const couponSchema = require('../../model/couponSchema.js')

const logger = require('../../config/pinoLogger.js')

const addCouponPage = async (req, res) => {
    try{
        res.status(200).render('admin/addCoupon')
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to add coupon page")
        res.status(500).json({success: false, message: "something went wrong (add coupon page)"})
    }
}

const addCouponPost = async (req, res) => {
    try{
        let { code, discount, startDate, endDate, minimumPurchase, maximumDiscount } = req.body
        console.log(req.body)
    
        await couponSchema.create({
            code, 
            discount,
            startDate, 
            endDate, 
            minimumPurchase, 
            maximumDiscount
        })

        res.status(200).json({success: true, message: "successfully created the coupon"})


    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post coupon")
        res.status(500).json({success: false, message: "something went wrong (coupon post)"})
    }
}

const couponManagement = async (req, res) => {
    try{
        const coupons = await couponSchema.find().sort({_id: -1}).limit(5)

        res.status(200).render('admin/couponManagement', {coupons,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get coupon management page")
        res.status(500).json({success: false, message: "something went wrong (coupon management page)"})
    }
}




module.exports = {
    addCouponPage,
    addCouponPost,
    couponManagement
}