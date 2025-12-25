

const { connect } = require('mongoose')
const adminSchema = require('../../model/adminSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const orderSchema = require('../../model/orderSchema.js')
const bcrypt = require("bcrypt")
// const userSchema = require('../../model/userSchema.js')

const logger = require('../../config/pinoLogger.js')

const loadLogin = async (req, res) => {
    try {
        res.status(200).render('admin/login')
    }
    catch (err) {
        console.log(err)
        console.log("failed to load the login page!")
        res.status(500).json({ messge: "something went wrong (admin login page)" })
    }
}

const loginVerify = async (req, res) => {
    try {
        const { email, password } = req.body

        const admin = await adminSchema.findOne({ email })

        if (!admin) {
            return res.status(404).json({ success: false, message: "email not found in the database" })
        }

        const isMatch = await bcrypt.compare(password, admin.password)

        if (!isMatch || admin.email !== email) {
            return res.status(401).json({ success: false, message: "invalid email or password !" })
        }

        req.session.admin = true
        res.status(200).redirect('/admin/dashboard')

    }
    catch (err) {
        console.log(err)
        console.log("failed to login  !")
    }
}

const loadDashboard = async (req, res) => {
    try {
        let { timeFrame } = req.query
        let filter, group, chartValues = [], chartDates = [], pieFields = [], pieValues = []
        const addField = {
            $addFields: { totalSale: { $reduce: { input: '$prices', "initialValue": 0, "in": { $add: ['$$value', '$$this'] } } } }
        }
        const week = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

        const now = new Date()
        const istNow = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        )

        if (timeFrame == "monthly") {
            const start = new Date(istNow)
            start.setMonth(0)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setFullYear(start.getFullYear() + 1)

            filter = {
                $match: { createdAt: { $gte: start, $lt: end } },
            }
            group = {
                $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 }, prices: { $push: '$payablePrice' } }
            }



        }
        else if (timeFrame == "yearly") {
            const start = new Date(istNow)
            start.setFullYear(2020)
            start.setMonth(0)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(istNow)

            filter = {
                $match: { createdAt: { $gte: start, $lt: end } },
            }
            group = {
                $group: { _id: { $year: '$createdAt' }, count: { $sum: 1 }, prices: { $push: '$payablePrice' } }
            }


        }
        else {
            timeFrame = "weekly"

            const start = new Date(istNow)
            start.setDate(istNow.getDate() - istNow.getDay())
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(start.getDate() + 7)

            filter = {
                $match: { createdAt: { $gte: start, $lt: end } },
            }
            group = {
                $group: { _id: { $dayOfWeek: { date: '$createdAt', timezone: "Asia/Kolkata" } }, count: { $sum: 1 }, prices: { $push: '$payablePrice' } }
            }



        }

        // orders for the line chart
        const orders = await orderSchema.aggregate([
            filter,
            group,
            addField
        ])
        
        const orderStatusForPieChart = await orderSchema.aggregate([
            filter,
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    Delivered: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Delivered"] }, 1, 0] }
                    },
                    Pending: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Pending"] }, 1, 0] }
                    },
                    Cancelled: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Cancelled"] }, 1, 0] }
                    },
                    Returned: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Returned"] }, 1, 0] }
                    },
                    "Return rejected": {
                        $sum: { $cond: [{ $eq: ["$items.status", "Return rejected"] }, 1, 0] }
                    }
                }
            },
            { $project: { _id: 0 } }
        ])

        const topSellingProducts = await orderSchema.aggregate([
            filter,
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' },
            { $lookup: { from: 'brands', localField: 'product.brandId', foreignField: '_id', as: 'brand' } },
            { $unwind: '$brand' },
            {
                $facet: {
                    variantCount: [
                        { $group: { _id: '$items.variantId', name: { $first: '$items.name' }, count: { $sum: 1 }, ram: { $first: '$items.ram' }, storage: { $first: '$items.storage' }, color: { $first: '$items.color' }, price: { $first: '$items.price' } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    categoryCount: [
                        { $group: { _id: '$category.name', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ],
                    brandCount: [
                        { $group: { _id: "$brand.name", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ]
                }
            }
        ])

        // to give the field and values for the pie chart
        for(let ele in orderStatusForPieChart[0]){
            pieFields.push(ele)
            pieValues.push(orderStatusForPieChart[0][ele])
        }


        if (timeFrame == "weekly") {
            const max = Math.max(...orders.map(ele => ele._id))

            for (let i = 0; i < max; i++) {
                chartDates.push(week[i])
            }

            orders.forEach(ele => {
                chartValues[ele._id - 1] = ele.totalSale
            })
        }
        else if (timeFrame == "monthly") {
            const max = Math.max(...orders.map(ele => ele._id))

            for (let i = 0; i < max; i++) {
                chartDates.push(month[i])
            }

            orders.forEach(ele => {
                chartValues[ele._id - 1] = ele.totalSale
            })
        }
        else if (timeFrame == "yearly") {
            const end = new Date(now)

            for (let i = 2020; i <= end.getFullYear(); i++) {
                chartDates.push(i)
            }

            orders.forEach(ele => {
                chartValues[chartDates.indexOf(ele._id)] = ele.totalSale
            })

        }

        // making the undefined elements zero for showing it on the chart
        for (let i = 0; i < chartValues.length; i++) {
            if (!chartValues[i]) {
                chartValues[i] = 0
            }
        }

        res.render('admin/adminHome', { chartDates, chartValues, topSellingProducts: topSellingProducts[0], pieFields, pieValues })
    }
    catch (err) {
        console.log(err)
        console.log("failed to load admin dashboard!")
    }
}

const applyFilter = async (req, res) => {
    try {
        let { timeFrame } = req.body
        let filter, group, chartValues = [], chartDates = [], pieFields = [], pieValues = []
        const addField = {
            $addFields: { totalSale: { $reduce: { input: '$prices', "initialValue": 0, "in": { $add: ['$$value', '$$this'] } } } }
        }
        const week = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

        const now = new Date()
        const istNow = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        )

        if (timeFrame == "monthly") {
            const start = new Date(istNow)
            start.setMonth(0)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setFullYear(start.getFullYear() + 1)

            filter = {
                $match: { createdAt: { $gte: start, $lt: end } },
            }
            group = {
                $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 }, prices: { $push: '$payablePrice' } }
            }



        }
        else if (timeFrame == "yearly") {
            const start = new Date(istNow)
            start.setFullYear(2020)
            start.setMonth(0)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(istNow)

            filter = {
                $match: { createdAt: { $gte: start, $lt: end } },
            }
            group = {
                $group: { _id: { $year: '$createdAt' }, count: { $sum: 1 }, prices: { $push: '$payablePrice' } }
            }


        }
        else {
            timeFrame = "weekly"

            const start = new Date(istNow)
            start.setDate(istNow.getDate() - istNow.getDay())
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(start.getDate() + 7)

            filter = {
                $match: { createdAt: { $gte: start, $lt: end } },
            }
            group = {
                $group: { _id: { $dayOfWeek: { date: '$createdAt', timezone: "Asia/Kolkata" } }, count: { $sum: 1 }, prices: { $push: '$payablePrice' } }
            }



        }

        // orders for the line chart
        const orders = await orderSchema.aggregate([
            filter,
            group,
            addField
        ])
        
        const orderStatusForPieChart = await orderSchema.aggregate([
            filter,
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    Delivered: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Delivered"] }, 1, 0] }
                    },
                    Pending: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Pending"] }, 1, 0] }
                    },
                    Cancelled: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Cancelled"] }, 1, 0] }
                    },
                    Returned: {
                        $sum: { $cond: [{ $eq: ["$items.status", "Returned"] }, 1, 0] }
                    },
                    "Return rejected": {
                        $sum: { $cond: [{ $eq: ["$items.status", "Return rejected"] }, 1, 0] }
                    }
                }
            },
            { $project: { _id: 0 } }
        ])

        const topSellingProducts = await orderSchema.aggregate([
            filter,
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' },
            { $lookup: { from: 'brands', localField: 'product.brandId', foreignField: '_id', as: 'brand' } },
            { $unwind: '$brand' },
            {
                $facet: {
                    variantCount: [
                        { $group: { _id: '$items.variantId', name: { $first: '$items.name' }, count: { $sum: 1 }, ram: { $first: '$items.ram' }, storage: { $first: '$items.storage' }, color: { $first: '$items.color' }, price: { $first: '$items.price' } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    categoryCount: [
                        { $group: { _id: '$category.name', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ],
                    brandCount: [
                        { $group: { _id: "$brand.name", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ]
                }
            }
        ])

        // to give the field and values for the pie chart
        for(let ele in orderStatusForPieChart[0]){
            pieFields.push(ele)
            pieValues.push(orderStatusForPieChart[0][ele])
        }


        if (timeFrame == "weekly") {
            const max = Math.max(...orders.map(ele => ele._id))

            for (let i = 0; i < max; i++) {
                chartDates.push(week[i])
            }

            orders.forEach(ele => {
                chartValues[ele._id - 1] = ele.totalSale
            })
        }
        else if (timeFrame == "monthly") {
            const max = Math.max(...orders.map(ele => ele._id))

            for (let i = 0; i < max; i++) {
                chartDates.push(month[i])
            }

            orders.forEach(ele => {
                chartValues[ele._id - 1] = ele.totalSale
            })
        }
        else if (timeFrame == "yearly") {
            const end = new Date(now)

            for (let i = 2020; i <= end.getFullYear(); i++) {
                chartDates.push(i)
            }

            orders.forEach(ele => {
                chartValues[chartDates.indexOf(ele._id)] = ele.totalSale
            })

        }

        // making the undefined elements zero for showing it on the chart
        for (let i = 0; i < chartValues.length; i++) {
            if (!chartValues[i]) {
                chartValues[i] = 0
            }
        }

        res.status(200).json(
            {
                chartDates, 
                chartValues, 
                topSellingProducts: topSellingProducts[0], 
                pieFields, 
                pieValues
            }
        )
    }
    catch (err) {
        console.log(err)
        console.log("failed to load admin dashboard!")
    }
}

const logout = async (req, res) => {
    try {
        req.session.admin = null
        res.redirect('/admin/login')
    }
    catch (err) {
        console.log(err)
        console.log("failed to logout")
        res.status(500).json({ success: false, message: "somwthing went wrong (admin logout)" })
    }
}


module.exports = {
    loadLogin,
    loginVerify,
    loadDashboard,
    applyFilter,
    logout
}