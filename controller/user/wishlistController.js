
const variantSchema = require('../../model/variantSchema.js')
const wishlistSchema = require('../../model/wishlistSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")
const userSchema = require('../../model/userSchema.js')

const wishlistPage = async (req, res) => {
    try {
        const id = req.session?.user || req.session?.passport?.user

        const wishlist = await wishlistSchema.aggregate([
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

        res.status(200).render('user/wishlist', {wishlist})
    } 
    catch (err) {
        logger.fatal(err)
        logger.fatal("failed to get wishlist page")
        res.status(500).json({success: false, message: "something went wrong (wishlist page)"})
    }
}

const wishlistPost = async(req, res) => {
    try{
        const { variantId } = req.body
        const id = req.session.user || req.session?.passport?.user
        
        const user = await userSchema.findOne({_id: id})
        if(!user){
            return res.status(404).json({success: false, message: "user not found"})
        }


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

        if(variant.length<=0){
            return res.status(404).render('pageNotFound', (err, html) => {
                return res.json({html})
            })
        }
        if(variant[0].isListed==false ||  variant[0]?.productDoc.isListed==false || variant[0]?.categoryDoc.isListed==false || variant[0]?.brand.isListed==false){
            logger.fatal("blocked")
            return res.status(423).json({success: false, message: "this product is blocked"})
        }
        
        const wishlist = await wishlistSchema.findOne({userId: id})

        if(wishlist){
            wishlist.items.push({variantId})
            await wishlist.save()
        }    
        else{
            const newWishlist = new wishlistSchema({
                userId: id,
                items: [{variantId}]
            })
            await newWishlist.save()
        }
        logger.fatal("success fully created whishlist")
        return res.status(200).json({success: true, message: "successfully added the product to wishlist"})
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

        // console.log(cart)

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
        const { variantId } = req.body
        logger.fatal({variantId}, "wishlist remove Id")
        
        
        const userId = req.session.user || req.session?.passport?.user

        const wishlist = await wishlistSchema.findOne({userId})

        // to remove the variant from the wishlist collection
        wishlist.items = wishlist.items.filter(ele => String(ele.variantId) != String(variantId))
        await wishlist.save()
        

        logger.fatal("successfulyy removed the variant from the wishlist")
        res.status(200).json({success: true, message: "successfully removed the product from wishlist"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to update quantity")
        res.status(500).json({success: false, message: "something went wrong (update quantity)"})
    }
}

const moveAllToCart = async (req, res) => {
    try{
        const { wishlistId } = req.body
        
        const id = req.session.user || req.session?.passport?.user

        // const wishlist = await wishlistSchema.findOne({_id: wishlistId})
        const wishlist = await wishlistSchema.aggregate([
            {$match: {_id: new Types.ObjectId(wishlistId)}},
            {$unwind: "$items"},
            {$lookup: {
                from: "variants",
                localField: "items.variantId",
                foreignField: "_id",
                as: "variant"
            }},
            {$project: {"variant.quantity": 1, "variant._id": 1, "_id": 1, "items": 1}},
            {$unwind: "$variant"},
            {$match: {"variant.quantity": {$gt: 0}}}
        ])
        if(wishlist.length <= 0){
            return res.status(400).json({success: false, message: "These products are out of stock"})
        }

        let cart = await cartSchema.findOne({userId: id})
        if(!cart){
            cart = new cartSchema({
                userId: id,
            })
            await cart.save()
        }

        // creating a map so that we dont have to use nested loop to check 
        // wether each variantId of cart.item match with variantId of wishlist.item
        let cartMap = new Map()

        // setting key value pairs for the cartMap
        for(let item of cart.items){
            cartMap.set(String(item.variantId), item)
        }

        // main operation of moving products from wishlist to cart
        for(let wishlistItem of wishlist){            
            const key = String(wishlistItem.items.variantId)

            if(cartMap.has(key)){
                const cartItem = cartMap.get(key)

                if(cartItem.quantity < 5){
                    cartItem.quantity+=1
                }
            }
            else{
                cart.items.push({
                    variantId: wishlistItem.items.variantId,
                    quantity: 1
                })
            }
        }

        
        // for(let ele1 in cart.items){
        //     for(let ele2 in wishlist.items){
        //         if(String(cart.items[ele1].variantId) == String(wishlist.items[ele2].variantId)){
        //             if(cart.items[ele1].quantity >= 5){
        //                 wishlist.items.splice(ele2, 1)
        //             }
        //             else{
        //                 wishlist.items.splice(ele2, 1)
        //                 cart.items[ele1].quantity+=1
        //             }
        //         }
        //     }
        // }

        // let result = wishlist.items.concat(cart.items)

        // cart.items = result
        await cart.save()

        const moveToCartIds = wishlist.map(ele => ele.items._id)

        await wishlistSchema.updateOne({_id: wishlistId}, {$pull: {items: {_id: {$in: moveToCartIds}}}})

        const result = await wishlistSchema.findOne({_id: wishlistId})

        res.status(200).json({success: true, message: "successfully moved all the products to the cart"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to to move all to cart from wishlist")
        res.status(500).json({success: false, message: "something went wrong (move all to cart from wishlist)"})
    }
}


module.exports = {
    wishlistPage,
    wishlistPost,
    updateQuantity,
    removeProduct,
    moveAllToCart
}