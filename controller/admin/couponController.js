
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

        
        const coupon = await couponSchema.findOne({code: new RegExp(`^${code}$`, "i")})

        if(coupon){
            return res.status(400).json({success: false, message: "coupon with this code already exist"})
        }
    
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
        const couponCount = await couponSchema.countDocuments()
        const limit = 5
        const coupons = await couponSchema.find().sort({_id: -1}).limit(limit)

        if (limit >= couponCount) {
            return res.status(200).render('admin/couponManagement', {coupons,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled"})
        }

        res.status(200).render('admin/couponManagement', {coupons,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get coupon management page")
        res.status(500).json({success: false, message: "something went wrong (coupon management page)"})
    }
}

const pagination = async (req, res) => {
    try{
        const { page } = req.params
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/coupon')
        }
        const couponCount = await couponSchema.countDocuments()
        const coupons = await couponSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        if(pageNo * limit + limit >= couponCount){
            res.render('admin/couponManagement', { coupons, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('admin/couponManagement', { coupons, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }

    }
    catch(err){
        console.log(err)
        console.log("failed to retrieve next page")
        res.status(500).json({message: "something went wrong, (category next page)"})
    }
}

const editCouponPage = async (req, res) => {
    try{
        const { couponId } = req.params

        const coupon = await couponSchema.findOne({_id: couponId})
        if(!coupon){
            return res.status(404).render('pageNotFound')
        }

        res.status(200).render('admin/editCoupon', {coupon})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get edit coupon page")
        res.status(500).json({success: false, message: "something went wrong (edit coupon page)"})
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

const editCouponPost = async (req, res) => {
    try{
        const { couponId } = req.params
        let { code, discount, startDate, endDate, minimumPurchase, maximumDiscount } = req.body

        const coupon = await couponSchema.findOne({_id: couponId})
        if(!coupon){
            return res.status(404).render('pageNotFound')
        }

        let editCode = code || coupon.code
        let editDiscount = discount || coupon.discount
        let editStartDate = startDate
        let editEndDate = endDate
        let editMinimumPurchase = minimumPurchase || coupon.minimumPurchase
        let editMaximumDiscount = maximumDiscount || coupon.maximumDiscount

        await couponSchema.updateOne({_id: couponId}, {
            code: editCode,
            discount: editDiscount,
            startDate: editStartDate,
            endDate: editEndDate,
            minimumPurchase: editMinimumPurchase,
            maximumDiscount: editMaximumDiscount
        })

        logger.info("successfully updated the coupon")
        res.status(200).json({success: true, message: "successfully edited coupon"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post coupon edit")
        res.status(500).json({success: false, message: "something went wrong (coupon edit post)"})
    }
}

module.exports = {
    addCouponPage,
    addCouponPost,
    couponManagement,
    pagination,
    editCouponPage,
    blockCoupon,
    unBlockCoupon,
    editCouponPost
}