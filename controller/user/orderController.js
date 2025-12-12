const stripe = require('../../config/stripe.js')

const variantSchema = require('../../model/variantSchema.js')
const cartSchema = require('../../model/cartSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const orderSchema = require('../../model/orderSchema.js')
const couponSchema = require('../../model/couponSchema.js')
const walletSchema = require('../../model/walletSchema.js')
const userCouponSchema = require('../../model/userCouponSchema.js')
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
        const { addressId, cartId, totalPriceBeforeDiscount, payablePrice, discountAmount, paymentMethod, couponId } = req.body
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
                "product.name": 1 ,
                discount: 1,
                "product._id": 1
            }},
            {$addFields: {"variant.image": "$$REMOVE"}},
            
        ])     

        const cartItems = cart.map(ele => {
                
            let price = Number(ele.variant.price)
            let discount = Number(ele.discount)
            let offAmount = price * (discount / 100)
            let finalPrice = Math.floor(price - offAmount)
            let subTotal  = finalPrice * ele.items.quantity
            let discountThisProductGets = (finalPrice / Number(totalPriceBeforeDiscount)) * Number(discountAmount)
            let priceAfterCouponDiscount = finalPrice - discountThisProductGets

            return {
                name: ele.product.name,
                price: ele.variant.price,
                ram: ele.variant.ram,
                storage: ele.variant.storage,
                color: ele.variant.color,
                quantity: ele.items.quantity,
                discount: ele.discount,
                priceAfterDiscount: finalPrice,
                subTotal,
                priceAfterCouponDiscount,
                image: ele.image,
                status: "Pending",            
                productId: ele.variant.productId,
                variantId: ele.variant._id
            }
        })

        // console.log(cartItems)
        console.log("payment method", paymentMethod)
        console.log("discount ammount", discountAmount)
        console.log("this is coupon id", couponId)

        // to decrease the quantity of the product after while ordering
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
            
        const orderId = await generateOrderId()                

        const coupon = await couponSchema.findOne({_id: couponId})
            
        const newOrder = new orderSchema({
            orderId,
            totalPriceBeforeDiscount,
            payablePrice,
            discountAmount,
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
            paymentMethod,
            userId,
            couponCode: coupon?.code,
            placedAt: Date.now()
        })

        if(paymentMethod=="Wallet"){
            const newTransactions = {
                amount: payablePrice,
                date: Date.now(),
                transactionType: "debit" ,
                description: `Order placed #${orderId}`,
                status: "Completed"
            }

            const updatedWallet = await walletSchema.findOneAndUpdate({userId}, {$inc: {balance: -payablePrice}, $push: {transactions: newTransactions}})
            
            if(!updatedWallet){
                return res.status(404).json({success: false, message: "cannot find the wallet"})
            }
        }

        req.session.orderId = newOrder._id

        // to mark coupon as used if order was made using coupon
        if(coupon){
            const userCoupon = await userCouponSchema.findOne({userId, couponId})
            if(userCoupon){
                await userCouponSchema.findOneAndUpdate({userId, couponId}, {$set: {used: true}})
                // console.log("this is updated usercoupon", userCoupon)
            }
            else{
                
                await userCouponSchema.create({
                    userId,
                    couponId,
                    startDate: coupon.startDate,
                    endDate: coupon.endDate,
                    used: true
                })

                // console.log("this is new user coupon", newUserCoupon)
            }

        }
       
        // to make the cart empty
        await cartSchema.findOneAndUpdate({_id: cartId}, {$set: {items: []}})
        
        // to reduce the product quantity
        await variantSchema.bulkWrite(bulkOp)

        // to give a coupon if it is the first order
        const orderCount = await orderSchema.find({userId}).countDocuments()
        console.log("order count", orderCount)
        if(orderCount==1){
            const coupon = await couponSchema.findOne({code: "FIRSTORDER5"})
            if(coupon){
                await userCouponSchema.create({
                    userId,
                    couponId: coupon._id,
                    startDate: Date.now(),
                    endDate: Date.now() + ((60 * 1000) * 60 * 24 * 3) 
                })
            }
        }
    
        await newOrder.save()

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
        const order = await orderSchema.findOne({}, {orderId: 1}).sort({_id: -1}).limit(1)
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
        // const orders = await orderSchema.find({userId}, {"items.quantity": 1, "items.image": 1, payablePrice: 1, totalPrice: 1,  status: 1, paymentMethod: 1, placedAt: 1, orderId: 1, couponCode: 1}).sort({_id: -1})

        // res.render('user/order', {orders})

        // -----------------------------------------------------------
        
        if(req.query.search){
            const orderSearch = await orderSchema.find({userId, orderId: req.query.search}, {"items.quantity": 1, "items.image": 1, payablePrice: 1, totalPrice: 1,  status: 1, paymentMethod: 1, placedAt: 1, orderId: 1, couponCode: 1})
            return res.status(200).render('user/order', {orders: orderSearch, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        const limit = 5
        const orderCount = await orderSchema.countDocuments()
        const orders = await orderSchema
            .find({userId}, {"items.quantity": 1, "items.image": 1, payablePrice: 1, totalPrice: 1,  status: 1, paymentMethod: 1, placedAt: 1, orderId: 1, couponCode: 1})
            .sort({_id: -1})
            .limit(limit)            

        if (limit >= orderCount) {
            // return res.status(200).render('user/order', {orders})
            return res.status(200).render('user/order', {orders, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        // res.status(200).render('user/order', {orders})
        res.status(200).render('user/order', {orders, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "null" })
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

        // if order not found
        if(!order){
            return res.status(404).json({success: false, message: "order not found"})            
        }
        const item = order.items.id(itemId)

        // checking if the current status of the order is cancellable or not
        const nonCancellable = ["Delivered", "Cancelled", "Returned"];
        if(nonCancellable.includes(item.status)){
            return res.status(400).json({success: false, message: `This item is ${item.status.toLowerCase()} and cannot be cancelled.`})
        }


        const variant = await variantSchema.findOne({_id: item.variantId})

        console.log("this is variant", variant)
        
        // if (!variant) {
        //     return res.status(500).json({ success: false, message: "Variant not found" });
        // }


        await variantSchema.findByIdAndUpdate(
            item.variantId,
            { $inc: { quantity: item.quantity } }
        );

        const newTransactions = {
            amount: item.priceAfterCouponDiscount,
            date: Date.now(),
            transactionType: "credit" ,
            description: `Cancellation of order #${order.orderId}`,
            status: "Completed"
        }

        const updatedWallet = await walletSchema.findOneAndUpdate({userId}, {$inc: {balance: item.priceAfterCouponDiscount}, $push: {transactions: newTransactions}})
        console.log("updated wallet", updatedWallet)

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
    logger.warn("return controller hit")
    try{
        const { itemId, userId, returnReason, custonReturnReason } = req.body

        logger.info({userId}, "this is user id")

        // console.log("thi sis reqeuest body", req.body)
        // console.log("this is requsest file", req.file)

        let imagePath = req?.file?.path.replace(/\\/g, '/')

        const order = await orderSchema.findOne({userId, "items._id":  new Types.ObjectId(itemId)})

        logger.info({itemId}, "this is item id")

        if(!order){
            return res.status(404).json({success: false, message: "order not found"})            
        }
        const item = order.items.id(itemId)

        // logger.fatal({item})

        const nonReturnable = ["Pending", "Cancelled", "Returned", "Shipped", "Out for delivery"];
        if(nonReturnable.includes(item.status)){
            console.log("inside non returnable", item.status)
            return res.status(400).json({success: false, message: `This item is ${item.status.toLowerCase()} and cannot be requeset to return.`})
        }

        const variant = await variantSchema.findOne({_id: item.variantId})
        if (!variant) {
            return res.status(500).json({ success: false, message: "Variant not found" });
        }



        // await variantSchema.findByIdAndUpdate(
        //     item.variantId,
        //     { $inc: { quantity: item.quantity } }
        // );

        item.return = {
            requested: true,
            reason: returnReason,
            customReason: custonReturnReason,
            image: imagePath,
            requestedAt: Date.now()            
        }
        item.status = "Return requested"

        await order.save()

        console.log("this is items after successffull request", item)
        console.log("updated order", order)

        logger.info("success fully req")
        res.status(200).json({success: true, message: "successfully Returned the order"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to return the product")
        res.status(500).json({success: false, message: "something went wrong (return product)"})
    }
}

const checkSession = async (req, res) => {
    try{
        const { addressId, cartId, totalPriceBeforeDiscount, payablePrice, discountAmount, paymentMethod, couponId } = req.body
        
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
                "product.name": 1 ,
                discount: 1,
                "product._id": 1
            }},
            {$addFields: {"variant.image": "$$REMOVE"}},
            
        ])  

        const lineItems = cart.map(ele => {
                
            let price = Number(ele.variant.price)
            let discount = Number(ele.discount)
            let offAmount = price * (discount / 100)
            let finalPrice = Math.floor(price - offAmount)
            let subTotal  = finalPrice * ele.items.quantity
            let discountThisProductGets = (finalPrice / Number(totalPriceBeforeDiscount)) * Number(discountAmount)
            let priceAfterCouponDiscount = finalPrice - discountThisProductGets

            return {
                price_data: {
                    currency: "inr",
                    unit_amount: priceAfterCouponDiscount * 100,
                    product_data: {
                        name: ele.product.name,
                        description: `${ele.variant.ram} | ${ele.variant.storage} | ${ele.variant.color} `
                    }
                },
                quantity: ele.items.quantity
            }
        })

        const session = await stripe.checkout.sessions.create({
            // ui_mode: 'embedded',
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                addressId, 
                cartId, 
                totalPriceBeforeDiscount, 
                payablePrice, 
                discountAmount,
                paymentMethod, 
                couponId
            },
            success_url: `http://localhost:3000/orderSuccess`
            // return_url: `http://localhost:4242/orderSuccess?session_id={CHECKOUT_SESSION_ID}`,
            // payment_method_types: ['bancontact', 'card', 'eps', 'ideal', 'p24', 'sepa_debit'],
        });
        logger.fatal(session.url)
        res.status(303).json({success: true, redirect: session.url})
        // res.redirect(303, session.url);
    
        // res.send({ clientSecret: session.client_secret });
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to cerate checkout sesssion for stripe")
        res.status(500).json({success: false, message: "something went wrong (failed to create checkout session for stripe)"})
    }
}

const webhook = async (req, res) => {

    const endpointSecret = process.env.STRIPE_WEBHOOK_KEY

    try{
        let event
            if (endpointSecret) {
                const signature = req.headers['stripe-signature'];
                try {
                    event = stripe.webhooks.constructEvent(
                        req.body,
                        signature,
                        endpointSecret
                    );
                    // console.log("this is event", event)
                    console.log("SESSION METADATA:", event.data.object.metadata);
                } catch (err) {
                    console.log(event)
                    console.log(`⚠️  Webhook signature verification failed.`, err.message);
                    return res.sendStatus(400);
                }
            }
        
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

                    break;
                case 'checkout.session.completed':
                    console.log("checkout.session.completed SESSION METADATA:", event.data.object.metadata);

                    const { addressId, cartId, totalPriceBeforeDiscount, payablePrice, discountAmount, paymentMethod, couponId } = event.data.object.metadata

                    const address = await addressSchema.findOne({_id: addressId}, {billingAddress: 1, userId: 1})
                                     
                    const userId = address.userId

                    logger.fatal({userId}, "this is userId")

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
                            "product.name": 1 ,
                            discount: 1,
                            "product._id": 1
                        }},
                        {$addFields: {"variant.image": "$$REMOVE"}},
                        
                    ])     

                    const cartItems = cart.map(ele => {
                            
                        let price = Number(ele.variant.price)
                        let discount = Number(ele.discount)
                        let offAmount = price * (discount / 100)
                        let finalPrice = Math.floor(price - offAmount)
                        let subTotal  = finalPrice * ele.items.quantity
                        let discountThisProductGets = (finalPrice / Number(totalPriceBeforeDiscount)) * Number(discountAmount)
                        let priceAfterCouponDiscount = finalPrice - discountThisProductGets

                        return {
                            name: ele.product.name,
                            price: ele.variant.price,
                            ram: ele.variant.ram,
                            storage: ele.variant.storage,
                            color: ele.variant.color,
                            quantity: ele.items.quantity,
                            discount: ele.discount,
                            priceAfterDiscount: finalPrice,
                            subTotal,
                            priceAfterCouponDiscount,
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
                    
                    let userAddress
                    address.billingAddress.forEach(ele => {
                        if(ele.isSelected==true){
                            userAddress = ele
                        }
                    })

                    const orderId = await generateOrderId()                

                    const coupon = await couponSchema.findOne({_id: couponId})
                        
                    const newOrder = new orderSchema({
                        orderId,
                        totalPriceBeforeDiscount,
                        payablePrice,
                        discountAmount,
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
                        paymentMethod,
                        userId,
                        couponCode: coupon?.code,
                        placedAt: Date.now()
                    })

                    // req.session.orderId = newOrder._id
                    
                    // to mark coupon as used if order was made using coupon
                    if(coupon){
                        const userCoupon = await userCouponSchema.findOne({userId, couponId})
                        if(userCoupon){
                            await userCouponSchema.findOneAndUpdate({userId, couponId}, {$set: {used: true}})
                            // console.log("this is updated usercoupon", userCoupon)
                        }
                        else{
                            
                            await userCouponSchema.create({
                                userId,
                                couponId,
                                startDate: coupon.startDate,
                                endDate: coupon.endDate,
                                used: true
                            })

                            // console.log("this is new user coupon", newUserCoupon)
                        }

                    }

                    // to make the cart empty
                    await cartSchema.findOneAndUpdate({_id: cartId}, {$set: {items: []}})
                    
                    // to reduce the product quantity
                    await variantSchema.bulkWrite(bulkOp)

                    // to give a coupon if it is the first order
                    const orderCount = await orderSchema.find({userId}).countDocuments()
                    if(orderCount==1){
                        const coupon = await couponSchema.findOne({code: "FIRSTORDER5"})
                        if(coupon){
                            await userCouponSchema.create({
                                userId,
                                couponId: coupon._id,
                                startDate: Date.now(),
                                endDate: Date.now() + ((60 * 1000) * 60 * 24 * 3) 
                            })
                        }
                    }

                    logger.info({newOrder}, "this is new order with stripe")
                    await newOrder.save()

                    logger.info("order success with payment through stripe")
                    // res.status(200).json({success: true, message: "Order successfully placed"})
 
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}.`);
                    console.log(`Unhandled event type ${event.id}.`);
            }
        
        res.send();
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post webhook")
        res.status(500).json({success: false, message: "something went wrong (webhook post)"})
    }
}

const pagination = async (req, res) => {
    try{
        const userId = req.session.user || req.session?.passport?.user
        const { page } = req.params

        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/orders')
        }
        const orderCount = await orderSchema.find({userId}).countDocuments()
        console.log(orderCount)
        const orders = await orderSchema
            .find({userId}, {"items.quantity": 1, "items.image": 1, payablePrice: 1, totalPrice: 1,  status: 1, paymentMethod: 1, placedAt: 1, orderId: 1, couponCode: 1})
            .sort({_id: -1})
            .skip(limit * pageNo)
            .limit(limit)

        if(pageNo * limit + limit >= orderCount){
            res.render('user/order', { orders, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('user/order', { orders, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get pagination page")
        res.status(500).json({success: false, message: "something went wrong (order pagination page)"})
    }
}

const searchOrder = async (req, res) => {
    try{
        const { search } = req.body

        return res.redirect(`/orders?search=${search}`)

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get order  page")
        res.status(500).json({success: false, message: "something went wrong (order  page)"})
    }
}
module.exports = {
    orderPost,
    orderSuccess,
    orderPage,
    orderDetailPage,
    cancelOrder,
    returnOrder,
    checkSession,
    webhook,
    pagination,
    searchOrder
}