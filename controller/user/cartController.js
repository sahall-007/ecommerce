
const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")

const cartPage = async (req, res) => {
    try {
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

        // console.log(cart)

        res.status(200).render('user/cart', {cart})
    } 
    catch (err) {
        logger.fatal(err)
        logger.fatal("failed to get cart page")
        res.status(500).json({success: false, message: "something went wrong (cart page)"})
    }
}

const cartPost = async(req, res) => {
    // logger.info("handler is hitting")
    try{
        const { variantId } = req.body
        const id = req.session.user || req.session.passport.user

        // logger.info({variantId})
        // logger.info({id})

        const variant = await variantSchema.aggregate([
            {$match: {_id: new Types.ObjectId(variantId)}},
            {$lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "productDoc"
            }},
            {$unwind: "$productDoc"},
            {$lookup: {
                from: "categories",
                localField: "productDoc.categoryId",
                foreignField: "_id",
                as: "categoryDoc"
            }},
            {$unwind: "$categoryDoc"},
            {$lookup: {
                from: "brands",
                localField: "productDoc.brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"}
        ])

        // logger.info({variant})

        if(variant.length<=0){
            logger.fatal("variant length 0")
            return res.status(404).render('pageNotFound', (err, html) => {
                return res.json({html})
            })
        }
        if(variant[0].isListed==false ||  variant[0]?.productDoc.isListed==false || variant[0]?.categoryDoc.isListed==false || variant[0]?.brand.isListed==false){
            logger.fatal("blocked")
            return res.status(400).json({success: false, message: "this product is blocked"})
        }
        
        const cart = await cartSchema.findOne({userId: id})
        // logger.warn({cart}, "cart")

        let variantExist = false
        if(cart && cart?.items?.length >= 0){
            cart.items.forEach(ele => {
                if(ele.variantId==variantId){
                    variantExist = true
                    ele.quantity += 1                    
                }
            })
            if(!variantExist){
                cart.items.push({variantId, quantity: 1})
            }
            await cart.save()
        }
        else{
            const newCart = new cartSchema({
                userId: id,
                items: [{variantId, quantity: 1}]
            })
            await newCart.save()
        }

        
        return res.status(200).json({success: true, message: "successfully added the product to cart"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post cart")
        res.status(500).json({success: false, message: "something went wrong (cart post)"})

    }
}

const updateQuantity = async (req, res) => {
    try{
        const { change, index, cartId } = req.body
        const id = req.session.user || req.session?.passport?.user
    
        const cart = await cartSchema.findOne({_id: cartId})

        console.log(cart)

        cart.items[index].quantity+=Number(change)
    
        await cart.save()

        res.status(200).json({success: true, message: "successfully updated quantity"})
    
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to update quantity")
        res.status(500).json({success: false, message: "something went wrong (update quantity)"})
    }
}

const removeProduct = async (req, res) => {
    try{
        const { index, cartId } = req.body

        await cartSchema.findOneAndUpdate({_id: cartId}, {$unset: {[`items.${index}`]: 1}})
        await cartSchema.findOneAndUpdate({_id: cartId}, {$pull: {items: null}})


        res.status(200).json({success: true, message: "successfully removed the product from cart"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to update quantity")
        res.status(500).json({success: false, message: "something went wrong (update quantity)"})
    }
}

module.exports = {
    cartPage,
    cartPost,
    updateQuantity,
    removeProduct
}