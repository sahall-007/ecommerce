
const cartSchema = require('../../model/cartSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")
const walletSchema = require('../../model/walletSchema.js')


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

        res.render('user/checkout', {cart, address, wallet})
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