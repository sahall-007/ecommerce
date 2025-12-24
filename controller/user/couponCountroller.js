
const userSchema = require('../../model/userSchema.js')
const couponSchema = require('../../model/couponSchema.js')
const userCouponSchema = require('../../model/userCouponSchema.js')
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")

const getCouponPage = async (req, res) => {
    try{
        const userId = req.session.user || req.session?.passport?.user
        
        const user = await userSchema.findOne({_id: userId})
        if(!user){
            return res.status(404).redirect('/login')
        }

        const userCoupons = await userCouponSchema.aggregate([
            {$match: {userId: new Types.ObjectId(userId)}},
            {$lookup: {
                from: "coupons",
                localField: "couponId",
                foreignField: "_id",
                as: "coupon"
            }},
            {$unwind: "$coupon"},
            {$match: {"coupon.isListed": true}},
            
        ])

        const userCouponSet = new Set()

        userCoupons.forEach(ele => {
            userCouponSet.add(ele.couponId)
        })

        const globalCoupons = await couponSchema.aggregate([
            {$match: 
                {$and: [{startDate: {$lte: new Date()}}, {endDate: {$gte: new Date()}}, {isListed: true}]}
            },
        ])

        const filteredGlobalCoupons = globalCoupons.filter(ele => !userCouponSet.has(ele._id))

        let coupons = userCoupons.concat(filteredGlobalCoupons)

        res.status(200).render('user/coupon', {coupons})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get coupon page")
        res.status(500).json({success: false, message: "something went wrong (user coupon page)"})
    }
}

module.exports = {
    getCouponPage
}