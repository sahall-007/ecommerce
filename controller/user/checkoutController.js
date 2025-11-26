
const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")


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
            {$lookup: {
                from: "products",
                localField: "variant.productId",
                foreignField: "_id",
                as: "product"
            }},
            {$unwind: "$product"},
            {$project: {
                image: {$arrayElemAt: ["$variant.image", 0]},
                items: 1,
                variant: 1,
                "product.name": 1 ,
                "product.discount": 1
            }},
            {$addFields: {"variant.image": "$$REMOVE"}},
        ])

        const address = await addressSchema.findOne({userId: id})

        res.render('user/checkout', {cart, address})
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