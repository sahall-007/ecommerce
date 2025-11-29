const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')
const { castObject } = require('../../model/userSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const orderSchema = require('../../model/orderSchema.js')

const logger = require('../../config/pinoLogger.js')
const { on } = require('nodemailer/lib/ses-transport/index.js')

const orderManagement = async (req, res) => {
    try{
        const orders = await orderSchema.find().sort({_id: -1}).populate("userId")

        // console.log(orders)
        res.status(200).render('admin/orderManagement', {orders})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get order management page")
        res.status(500).json({success: false, message: "something went wrong (order management page)"})
    }
}

const adminOrderDetailPage = async (req, res) => {
    try{
        const { orderId } = req.params
        // logger.info(orderId)
        const order = await orderSchema.findOne({_id: orderId})

        if(!order){
            return res.status(404).render('pageNotFound')
        }

        res.render('admin/orderDetail', {order})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get admin order detail page")
        res.status(500).json({success: false, message: "something went wrong (admin order detail page)"})
    }
}

const editStatus = async (req, res) => {
    try{
        const { orderItemId, orderId, index, newStatus } = req.body
        console.log(req.body)

        const order = await orderSchema.findOne({_id: orderId, "items._id": orderItemId})

        if(!order){
            return res.status(404).json({success: false, message: "order not found"})
        }

        order.items.id(orderItemId).status = newStatus
        await order.save()

        res.status(200).json({success: true, message: "successfully changed the product status"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to edit the product status")
        res.status(500).json({success: false, message: "something went wrong (edit product status)"})
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
    orderManagement,
    adminOrderDetailPage,
    editStatus,
    cancelOrder,
    returnOrder
}