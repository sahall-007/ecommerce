
const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const orderSchema = require('../../model/orderSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")

async function generateOrderId(){
    const lastOrderId = await orderSchema.findOne({}, {_id: 1, orderId: 1}, {sort: {_id: -1}})

    if(!lastOrderId){
        return "ORD1001"
    }

    const lastId = lastOrderId.orderId
    const numPart = lastId.slice(3)
    const nextNum = Number(numPart) + 1

    return "ORD" + nextNum
}

const orderPost = async (req, res) => {
    try{
        const { addressId, cartId, totalPrice, finalPrice, couponDiscount, paymentMethod } = req.body
        const userId = req.session.user || req.session?.passport?.user

        const cart = await cartSchema.aggregate([
            {$match: {_id: new Types.ObjectId(cartId)}},
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
                "product.discount": 1,
                "product._id": 1
            }},
            {$addFields: {"variant.image": "$$REMOVE"}},
            
        ])

        const cartItems = cart.map(ele => {
            return {
                name: ele.product.name,
                price: ele.variant.price,
                ram: ele.variant.ram,
                storage: ele.variant.ram,
                color: ele.variant.color,
                quantity: ele.items.quantity,
                discount: ele.product.discount,
                image: ele.image,
                status: "Pending",            
                productId: ele.variant.productId,
                variantId: ele.variant._id
            }
        })

       const bulkOp = cart.map(ele => {
            return{
                updateOne: {
                    filter: {_id: ele.items.variantId},
                    update: {$inc: {quantity: -ele.items.quantity}}
                }
            }
       })

        const address = await addressSchema.findOne({_id: addressId}, {billingAddress: 1})

        let userAddress
        address.billingAddress.forEach(ele => {
            if(ele.isSelected==true){
                userAddress = ele
            }
        })

//         console.log("USING ORDER MODEL FROM:", require.resolve("../../model/orderSchema"));
// console.log("SCHEMA PATHS:", orderSchema.schema.paths);

//         console.log("USING ORDER MODEL FROM:", orderSchema.modelName);
// console.log("SCHEMA PATHS:", orderSchema.schema.paths);

        const orderId = await generateOrderId()

        const newOrder = await orderSchema.create({
            orderId,
            totalPrice,
            finalPrice,
            items: cartItems,
            billingAddress: {
                fullname: userAddress.fullname,
                email: userAddress.email,
                pincode: userAddress.pincode,
                phone: userAddress.phone,
                address: userAddress.address,
                addressType: userAddress.addressType,
                isSelected: userAddress.isSelected,
            } ,
            status: "Pending",
            paymentMethod: "COD",
            userId,
            placedAt: Date.now()
        })
        req.session.orderId = newOrder._id

        await cartSchema.findOneAndDelete({_id: cartId}, {$set: {items: []}})
        await variantSchema.bulkWrite(bulkOp)
    
        logger.info("order success")
        res.status(200).json({success: true, message: "Order successfully placed"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post order")
        res.status(500).json({success: false, message: "something went wrong (order post)"})
    }
}

const orderSuccess = async (req, res) => {
    try{
        const order = await orderSchema.findOne({_id: req.session.orderId}, {orderId: 1})
        const orderId = order.orderId
        res.render('user/orderSuccess', {orderId})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to order success page")
        res.status(500).json({success: false, message: "something went wrong (order success page)"})
    }
}

const orderPage = async (req, res) => {
    try{
        const userId = req.session.user || req.session?.passport?.user
        const orders = await orderSchema.find({userId}, {"items.quantity": 1, "items.image": 1, finalPrice: 1, totalPrice: 1,  status: 1, paymentMethod: 1, placedAt: 1, orderId: 1}).sort({_id: -1})

        res.render('user/order', {orders})
    }   
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to order  page")
        res.status(500).json({success: false, message: "something went wrong (order  page)"})
    }
}

const orderDetailPage = async (req, res) => {
    try{
        const { orderId } = req.params
        // logger.info(orderId)
        const order = await orderSchema.findOne({_id: orderId}).populate("userId")

        if(!order){
            return res.status(404).render('pageNotFound')
        }

        res.render('user/orderDetail', {order})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to order detail page")
        res.status(500).json({success: false, message: "something went wrong (order detail page)"})
    }
}

const cancelOrder = async (req, res) => {
    try{
        const { itemId, userId } = req.body

        const order = await orderSchema.findOne({userId, "items._id": itemId})

        if(!order){
            return res.status(404).json({success: false, message: "order not found"})            
        }
        const item = order.items.id(itemId)

        const nonCancellable = ["Delivered", "Cancelled", "Returned"];
        if(nonCancellable.includes(item.status)){
            return res.status(400).json({success: false, message: `This item is ${item.status.toLowerCase()} and cannot be cancelled.`})
        }

        const variant = await variantSchema.findOne({_id: item.variantId})
        if (!variant) {
            return res.status(500).json({ success: false, message: "Variant not found" });
        }
        await variantSchema.findByIdAndUpdate(
            item.variantId,
            { $inc: { quantity: item.quantity } }
        );

        item.cancellation = {
            requested: true,
            requestedAt: Date.now()            
        }
        item.status = "Cancelled"

        await order.save()
        res.status(200).json({success: true, message: "successfully cancelled the order"})
       
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to cancel the product")
        res.status(500).json({success: false, message: "something went wrong (cancel product order)"})
    }
}

const returnOrder = async (req, res) => {
    console.log("----------------------------------------------------------")
    try{
        const { itemId, userId } = req.body

        const order = await orderSchema.findOne({userId, "items._id": itemId})

        if(!order){
            return res.status(404).json({success: false, message: "order not found"})            
        }
        const item = order.items.id(itemId)

        const nonReturnable = ["Pending", "Cancelled", "Returned", "Shipped", "Out for delivery"];
        if(nonReturnable.includes(item.status)){
            return res.status(400).json({success: false, message: `This item is ${item.status.toLowerCase()} and cannot be cancelled.`})
        }

        const variant = await variantSchema.findOne({_id: item.variantId})
        if (!variant) {
            return res.status(500).json({ success: false, message: "Variant not found" });
        }
        await variantSchema.findByIdAndUpdate(
            item.variantId,
            { $inc: { quantity: item.quantity } }
        );

        item.return = {
            requested: true,
            requestedAt: Date.now()            
        }
        item.status = "Returned"

        
        await order.save()
        res.status(200).json({success: true, message: "successfully Returned the order"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to return the product")
        res.status(500).json({success: false, message: "something went wrong (return product)"})
    }
}

module.exports = {
    orderPost,
    orderSuccess,
    orderPage,
    orderDetailPage,
    cancelOrder,
    returnOrder
}