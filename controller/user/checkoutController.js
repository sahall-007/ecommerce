
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")

const addressSchema = require('../../model/addressSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const walletSchema = require('../../model/walletSchema.js')
const couponSchema = require('../../model/couponSchema.js')
const userCouponSchema = require('../../model/userCouponSchema.js')


const checkoutPage = async (req, res) => {
    try{
        const id = req.session?.user || req.session?.passport?.user
        
        const cart = await cartSchema.aggregate([
            {$match: {userId: new Types.ObjectId(id)}},
            {$unwind: "$items"},
            {$lookup: {
                from: "variants",
                localField: "items.variantId",
                foreignField: "_id",
                as: "variant"
            }},
            {$unwind: "$variant"},
            {$match: {"variant.quantity": {$gt: 0}}},
            {$lookup: {
                from: "products",
                localField: "variant.productId",
                foreignField: "_id",
                as: "product"
            }},
            {$unwind: "$product"},
            {$lookup: {
                from: "categories",
                localField: "product.categoryId",
                foreignField: "_id",
                as: "category"
            }},
            {$unwind: "$category"},
            {$lookup: {
                from: "brands",
                localField: "product.brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"},        
            {$lookup: {
                from: "offertargets",
                let: { productId: "$product._id" },
                pipeline: [{
                    $match: {$expr: {$and: [{$eq: ["$productId", "$$productId"]}, { $eq: ["$isActive", true] }]}}
                }],
                as: "offerTargets"
            }},      
            {$lookup: {
                from: "offers",
                let: { offerId: "$offerTargets.offerId" },
                pipeline: [{
                    $match: {$expr: {$and: [{$in: ["$_id", "$$offerId"]}, { $eq: ["$isActive", true] }]}}
                }],
                as: "offer"
            }},   
            {$addFields: {
                offerTargetDiscount: {$ifNull: [{ $max: "$offer.discount" }, 0]}
            }}, 
            {$addFields: {
                discount: {$max: ["$product.discount", "$offerTargetDiscount"]}
            }},

            {$project: {
                image: {$arrayElemAt: ["$variant.image", 0]},
                items: 1,
                variant: 1,
                "product.name": 1,
                discount: 1
            }},
            {$addFields: {"variant.image": "$$REMOVE"}},
        ])

        const wallet = await walletSchema.findOne({userId: id})
        if(!wallet){
            return res.status(404).json({success: false, message: "wallet not found in the database"})
        }

        const address = await addressSchema.findOne({userId: id})

        const userCoupons = await userCouponSchema.aggregate([
            {$match: 
                {$and: [{userId: new Types.ObjectId(id)}, {startDate: {$lte: new Date()}}, {endDate: {$gte: new Date()}}]}
            },
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

        res.render('user/checkout', {cart, address, wallet, coupons})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get checkout page")
        res.status(500).json({success: false, message: "something went wrong (checkout page)"})
    }
}



module.exports = {
    checkoutPage
}