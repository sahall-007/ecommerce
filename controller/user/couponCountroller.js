
const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const wishlistSchema = require('../../model/wishlistSchema.js')
const couponSchema = require('../../model/couponSchema.js')
const userCouponSchema = require('../../model/userCouponSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
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
        const globalCoupons = await couponSchema.aggregate([
            {$match: 
                {$and: [{startDate: {$gte: new Date()}}, {endDate: {$lte: "endDate"}}, {"coupon.isListed": true}]}
            },
        ])

        for(let ele1 in globalCoupons){
            for(let ele2 in userCoupons){
                if(String(globalCoupons[ele1]._id) == String(userCoupons[ele2].couponId)){
                    globalCoupons.splice(ele1, 1)
                }
            }
        }

        

        let coupons = userCoupons.concat(globalCoupons)

        console.log(coupons)

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