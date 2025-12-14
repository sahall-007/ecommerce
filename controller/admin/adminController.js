

const { connect } = require('mongoose')
const adminSchema = require('../../model/adminSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const orderSchema = require('../../model/orderSchema.js')
const bcrypt = require("bcrypt")
// const userSchema = require('../../model/userSchema.js')

const logger = require('../../config/pinoLogger.js')

const loadLogin = async (req, res) => {
    try{
        res.status(200).render('admin/login')
    }
    catch(err){
        console.log(err)
        console.log("failed to load the login page!")
        res.status(500).json({messge: "something went wrong (admin login page)"})
    }
}

const loginVerify = async (req, res) =>{
    try{
        const { email, password } = req.body

        const admin = await adminSchema.findOne({ email })

        if(!admin){
            return res.status(404).json({success: false, message: "email not found in the database"})
        }

        const isMatch = await bcrypt.compare(password, admin.password)

        if (!isMatch || admin.email !== email) {
            return res.status(401).json({success: false, message: "invalid email or password !"})
        }

        req.session.admin = true
        console.log("session created")
        res.status(200).redirect('/admin/dashboard')

    }
    catch(err){
        console.log(err)
        console.log("failed to login  !")
    }
}

const loadDashboard = async (req, res) => {
    try{
        let { timeFrame, startDate, endDate } = req.query
        let filter 
        
        if(timeFrame=="weekly"){
            logger.info("weekly")

            const currentDate = new Date()
            let monthDate = currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -7 : 0);

            let start = new Date(currentDate.setDate(monthDate))
            start.setHours(0, 0, 0, 0)

            let end = new Date(start)
            end.setDate(monthDate + 7)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame == "yearly"){
            logger.info("daily")

            const start = new Date()
            start.setMonth(1)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setFullYear(start.getFullYear() + 1)
            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(startDate && !endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$gte: start} }
            }
        }
        else if(endDate && !startDate){
            const end = new Date(endDate)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$lte: end} }
            }
        }
        else if(startDate && endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame=="monthly"){
            logger.info("monthly")
            filter = {
                $match:{
                    $expr: {
                        $and: [{$eq: [{$month: "$createdAt"}, {$month: "$$NOW"}]}, {$eq: [{$year: "$createdAt"}, {$year: "$$NOW"}]}]
                    }
                }
            }
        }
        else{
            timeFrame = "daily"

            logger.info("daily")
            const start = new Date()
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(start.getDate() + 1)
            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
  
        const orders = await orderSchema.aggregate([
            filter,
            {$addFields: {
                
                totalOriginalPrice: {
                    $reduce: {
                        input: "$items",
                        initialValue: 0,
                        in: {$add: ["$$value", "$$this.price"]}
                    } 
                },
                totalPriceAfterDiscount: {
                    $reduce: {
                        input: "$items",
                        initialValue: 0,
                        in: {$add: ["$$value", "$$this.priceAfterDiscount"]}
                    } 
                }                               
            }},
            {$addFields: {
                totalDiscountPrice: {
                    $subtract: ["$totalOriginalPrice", "$totalPriceAfterDiscount"]
                }                
            }}, 
            {$lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }},
            {$unwind: "$user"},

            {$project: {
                _id: 1,
                orderId: 1,
                payablePrice: 1,
                discountAmount: 1,
                totalDiscountPrice: 1,
                createdAt: 1,
                "user.username": 1
            }},
        ])
        logger.warn(timeFrame)
        res.render('admin/adminHome', {orders, timeFrame})
    }
    catch(err){
        console.log(err)
        console.log("failed to load admin dashboard!")
    }
}

const logout = async (req, res) => {
    try{
        req.session.admin = null
        res.redirect('/admin/login')
    }
    catch(err){
        console.log(err)
        console.log("failed to logout")
        res.status(500).json({success: false, message: "somwthing went wrong (admin logout)"})
    }
}


module.exports = {
    loadLogin,
    loginVerify,
    loadDashboard,
    logout
}