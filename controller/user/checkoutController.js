
const cartSchema = require('../../model/cartSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")
const walletSchema = require('../../model/walletSchema.js')
const couponSchema = require('../../model/couponSchema.js')
const userCouponSchema = require('../../model/userCouponSchema.js')


const checkoutPage = async (req, res) => {
    try{

        const id = req.session?.user || req.session?.passport?.user
        
                // const cart = await cartSchema.findOne({userId: id})
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
            {$addFields: {
                discount: {$max: ["$product.discount", "$category.discount", "$brand.discount"]}
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
            {$match: {userId: new Types.ObjectId(id)}},
            {$lookup: {
                from: "coupons",
                localField: "couponId",
                foreignField: "_id",
                as: "coupon"
            }},
            {$unwind: "$coupon"},
            {$match: {"coupon.isListed": true}},
            // {$project: {couponId: 1, "coupon.code": 1, "coupon.discount": 1, "coupon.minimumPurchase": 1, "coupon.maximumDiscount": 1}}
            
        ])
        const globalCoupons = await couponSchema.aggregate([
            {$match: 
                {$and: [{startDate: {$lte: new Date()}}, {endDate: {$gte: new Date()}}, {isListed: true}]}
            },            
            // {$project: {_id: 1, code: 1, discount: 1, minimumPurchase: 1, maximumDiscount: 1}}
        ])

        for(let ele1 in globalCoupons){
            for(let ele2 in userCoupons){
                if(String(globalCoupons[ele1]._id) == String(userCoupons[ele2].couponId)){
                    globalCoupons.splice(ele1, 1)
                }
            }
        }


        let coupons = userCoupons.concat(globalCoupons)

        // console.log("this is usercoupons", userCoupons)
        // console.log("this are global coupons", globalCoupons)
        // console.log("these are checkout coupons", coupons)

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