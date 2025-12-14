
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

const blockCoupon = async (req, res) => {

    try{
        const { id } = req.body

        await couponSchema.findOneAndUpdate({_id: id}, {$set: {isListed: false}})

        res.status(200).json({message: "coupon has been blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to block the coupon")
        res.status(500).json({message: "something went wrong (block coupon)"})
    }
}

const unBlockCoupon = async (req, res) => {
    logger.fatal("its hit")    
    try{
        const { id } = req.body

        await couponSchema.findOneAndUpdate({_id: id}, {$set: {isListed: true}})

        res.status(200).json({message: "category has been unblocked"})

    }
    catch(err){
        console.log(err)
        console.log("failed to unblock coupon")
        res.status(500).json({message: "something went wrong (unblock coupon)"})
    }
}


module.exports = {
    addCouponPage,
    addCouponPost,
    couponManagement,
    blockCoupon,
    unBlockCoupon
}