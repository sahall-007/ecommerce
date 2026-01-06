
const variantSchema = require('../../model/variantSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const wishlistSchema = require('../../model/wishlistSchema.js')
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")

const cartPage = async (req, res) => {
    try {
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
                "product.name": 1 ,
                discount: 1       
            }},
            {$addFields: {"variant.image": "$$REMOVE"}},
            
        ])

        console.log(cart)

        res.status(200).render('user/cart', {cart})
    } 
    catch (err) {
        logger.fatal(err)
        logger.fatal("failed to get cart page")
        res.status(500).json({success: false, message: "something went wrong (cart page)"})
    }
}

const cartPost = async(req, res) => {
    try{
        const { variantId } = req.body
        const id = req.session.user || req.session?.passport?.user

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
            {$unwind: "$brand"},
            {$lookup: {
                from: "offertargets",
                let: { productId: "$productId" },
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
        ])

        if(variant.length<=0){
            return res.status(404).render('pageNotFound', (err, html) => {
                return res.json({html})
            })
        }
        if(variant[0].isListed==false ||  variant[0]?.productDoc.isListed==false || variant[0]?.categoryDoc.isListed==false || variant[0]?.brand.isListed==false){
            logger.warn("blocked")
            return res.status(423).json({success: false, message: "this product is blocked"})
        }
        if(variant[0].quantity<=0){
            logger.warn("out of stock")
            return res.status(400).json({success: false, message: "out of stock"})
        }
        
        const cart = await cartSchema.findOne({userId: id})

        let variantExist = false
        if(cart && cart?.items?.length >= 0){

            for(let i=0; i<cart.items.length; i++){

                if(cart.items[i].variantId==variantId ){

                    if(cart.items[i].quantity < 5){
                        variantExist = true
                        cart.items[i].quantity += 1  
                        
                            if(cart.items[i].quantity > variant[0].quantity){
                            return res.status(400).json({success: false, message: "max quantity of product reached"})                            
                        }
                    }
                    else{
                        return res.status(400).json({success: false, message: "Max quantity cant be greater than 5"})   
                    }
                }
            }
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

        const wishlist = await wishlistSchema.findOne({userId: id})
        wishlist.items = wishlist.items.filter(ele => 
            !ele.variantId.equals(variantId)
        )

        await wishlist.save()
        
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
    
        const cart = await cartSchema.findOne({_id: cartId})

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