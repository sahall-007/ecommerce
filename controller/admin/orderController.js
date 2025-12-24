const variantSchema = require('../../model/variantSchema.js')
const orderSchema = require('../../model/orderSchema.js')
const walletSchema = require('../../model/walletSchema.js')
const { Types, default: mongoose } = require('mongoose')


const logger = require('../../config/pinoLogger.js')
const { on } = require('nodemailer/lib/ses-transport/index.js')
const { search } = require('../../routes/admin/orderRoute.js')

const orderManagement = async (req, res) => {
    try{
        if(req.query.search){
            const orderSearch = await orderSchema.find({orderId: req.query.search}).populate("userId")
            return res.status(200).render('admin/orderManagement', {orders: orderSearch, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        const limit = 5
        const orderCount = await orderSchema.countDocuments()
        const orders = await orderSchema.find().sort({_id: -1}).limit(limit).populate("userId")

        if (limit >= orderCount) {
            return res.status(200).render('admin/orderManagement', {orders, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('admin/orderManagement', {orders, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "null" })

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

        const order = await orderSchema.findOne({_id: orderId, "items._id": orderItemId})

        if(!order){
            return res.status(404).json({success: false, message: "order not found"})
        }

        order.items.id(orderItemId).status = newStatus
        
        if(newStatus == "Return approved"){
            const newTransactions = {
                amount: order.items.id(orderItemId).priceAfterCouponDiscount,
                date: Date.now(),
                transactionType: "credit" ,
                description: `Refund of order #${order.orderId}`,
                status: "Pending"
            }

            const wallet = await walletSchema.findOneAndUpdate(
                {userId: order.userId}, 
                {$push: {transactions: newTransactions}}, 
                { new: true }
            )

            if (!wallet) {
                return res.status(404).json({ success: false, message: "Wallet not found" });
            }

            // putting the latest transaction id into refundTransactionId so that it can be access later to update the transaction status
            order.items.id(orderItemId).refundTransactionId = wallet.transactions[wallet.transactions.length - 1]._id

            console.log("this is wallet after update of return approved", wallet)
        }

        // refund money after order is returned
        else if(newStatus == "Returned"){
            const transId = order.items.id(orderItemId).refundTransactionId

            if (!transId) {
                return res.status(400).json({
                    success: false,
                    message: "No refundTransactionId found for this item"
                });
            }

            const wallet = await walletSchema.findOneAndUpdate(
                {userId: order.userId, "transactions._id": transId}, 
                {$inc: {balance: order.items.id(orderItemId).priceAfterCouponDiscount}, $set: {"transactions.$.status": "Completed"}},
                { new: true }
            )

            console.log("this is wallet after update of returned", wallet)
        }

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

const pagination = async (req, res) => {
    try{
        const { page } = req.params

        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/orders')
        }
        const orderCount = await orderSchema.countDocuments()
        const orders = await orderSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit).populate("userId")

        if(pageNo * limit + limit >= orderCount){
            res.render('admin/orderManagement', { orders, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('admin/orderManagement', { orders, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get pagination page")
        res.status(500).json({success: false, message: "something went wrong (order pagination page)"})
    }
}

const rejectRequest = async (req, res) => {
    try{
        const { itemId, userId, rejectReason, custonReturnRejectReason } = req.body
    
        const order = await orderSchema.findOne({userId, "items._id":  new Types.ObjectId(itemId)})
        if(!order){
            return res.status(404).json({success: false, message: "order not found"})            
        }

        const item = order.items.id(itemId)

        item.returnReject = {
            rejected: true,
            reason: rejectReason,
            customReason: custonReturnRejectReason,
            rejectedAt: Date.now()
        }
        item.status = "Return rejected"

        await order.save()

        res.status(200).json({success: true, message: "successfully rejected the request"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to reject the return request")
        res.status(500).json({success: false, message: "something went wrong (reject return request)"})

    }
}

const searchOrder = async (req, res) => {
    try{
        const { search } = req.body

        return res.redirect(`/admin/orders?search=${search}`)

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get order management page")
        res.status(500).json({success: false, message: "something went wrong (order management page)"})
    }
}

const returnRequestPage = async (req, res) => {
    try{
        const orders = await orderSchema.aggregate([
            {$match: {"items.status": {$in: ["Return requested", "Return approved", "Returning"]}}}
        ])

        res.status(200).render('admin/returnRequest', {orders})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get request return page")
        res.status(500).json({success: false, message: "something went wrong (request return page)"})
    }
}

module.exports = {
    orderManagement,
    adminOrderDetailPage,
    editStatus,
    cancelOrder,
    returnOrder,
    pagination,
    rejectRequest,
    searchOrder,
    returnRequestPage
}