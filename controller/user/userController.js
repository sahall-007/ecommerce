
const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const wishlistSchema = require('../../model/wishlistSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const rndm = require('rndm')
const env = require('dotenv').config()
const { Types } = require('mongoose')

const logger = require("../../config/pinoLogger.js")
const walletSchema = require('../../model/walletSchema.js')
const couponSchema = require('../../model/couponSchema.js')
const userCouponSchema = require('../../model/userCouponSchema.js')

// logger.info("server has started")

const salt = 10

// to generate OTP
function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// to send the OTP to the provided email by the user during sign up
async function sendVerificationEmail(email, otp){
    try{
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.APP_EMAIL,
                pass: process.env.APP_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.APP_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        })

        return info.accepted.length > 0

    }
    catch(err){
        console.error("Error sending email", err)
        return false
    }
}

// to load the register page
const loadRegister = async (req, res) => {
    try {

        if(req.session.matchPass==false){
            req.session.matchPass = true
            return res.status(409).render('user/register', {confirm: "Password doesn't match, Try again", 
                                                       username: null,
                                                       email: null,
                                                       password: null
            })
        }

        if(req.session.userExist==true){
            req.session.userExist = false
            return res.status(409).render('user/register', {email: "Email already in use, Try again",
                                                       username: null,                                                
                                                       password: null,
                                                       confirm: null
            })
        }

        res.render('user/register', {confirm: null,
                                username: null,
                                email: null,
                                password: null
        })
    }
    catch (err) {
        logger.info(err)
        logger.info("failed to load the register page!")
        res.status(500).json({success: false, message: "something went wrong (register page)"})
    }
}

// to validate the register details from the user
const registerUser = async (req, res) => {
    try {

        const { username, email, password, confirm, referral } = req.body

        // console.log(req.body)

        if(password!=confirm){
            req.session.matchPass = false
            return redirect('/register')
        }

        const user = await userSchema.findOne({email})

        if(user){
            req.session.userExist = true
            return res.redirect('/register')
        }

        const otp =  generateOtp()
        const emailSent = await sendVerificationEmail(email, otp)

        if(!emailSent){
            return res.json({message: "error sendig email"})
        }

        req.session.userOTP = {
            otp,
            expiryAt: Date.now() + 60*1000
        }
    
        req.session.userData = { username, email, password, referral }

        console.log("this is userdata", req.session.userData)

        res.redirect('/otp')

    }
    catch (err) {
        logger.info(err)
        logger.info("failed to register the user!")
        res.status(500).json({success: false, message: "something went wrong (reigster post)"})
    }
}

// to load the login pages
const loadLogin = async (req, res) => {
    try {
        res.render('user/userLogin')
    }
    catch (err) {
        logger.error(err)
        logger.error("failed to load the login page!")
    }
}

// to verify the login details
const loginPost = async (req, res) => {
    try{
        const { username, email, password } = req.body

        const userExist = await userSchema.findOne({email})
        if(!userExist){
            return res.status(404).json({success: false, message: "create an account first"})
        }
        
        const isMatch = await bcrypt.compare(password, userExist.password)
        if (!isMatch || userExist.email !== email) {
            return res.status(401).json({success: false, message: "invalid email or password"})
        }
        
        if(userExist.isListed==false){
            return res.status(403).json({success: false, message: "You are blocked by the Admin"})
        }

        var referral = rndm.base62(10)
        if(!userExist?.referral){
            userExist.referral = referral
            await userExist.save()
        }

        const wishlist = await wishlistSchema.findOne({userId: userExist._id})
        if(!wishlist){
            await wishlistSchema.create({
                userId: userExist._id,
                items: []
            })
        }

        const wallet = await walletSchema.findOne({userId: userExist._id})
        if(!wallet){
            await walletSchema.create({
                userId: userExist._id,
            })
        }

        // giving the welcome coupon if the user did not got it while registring
        const coupon = await couponSchema.findOne({code: "WELCOME10"})
        if(coupon){
            const userCoupon = await userCouponSchema.findOne({userId: userExist._id, couponId: coupon._id})
            if(!userCoupon){
                await userCouponSchema.create({
                    userId: userExist._id,
                    couponId: coupon._id,
                    startDate: Date.now(),
                    endDate: Date.now() + ((60 * 1000) * 60 * 24 * 10) 
                })
                logger.info("successfully created welcome coupon")
            }
        }
        
        

        req.session.user = userExist._id
        
        logger.info( {userId: req.session.user}, "login post")

        res.status(200).json({success: true, message: "successfully logged in"})
        // res.redirect('/')

    }
    catch(err){
        logger.error(err)
        logger.error("failed to login")
        res.status(500).json({success: false, message: "something went wrong (post login)"})
    }
}

const guestLogin = async (req, res) => {
    try{
        res.redirect('/')
    }
    catch(err){
        logger.error(err)
        logger.error("failed to login as guest")
        res.status(500).json({success: false, message: "something went wrong (guest login)"})
    }
}

// to load the otp page
const loadOtpPage = async (req, res) =>{
    try{
        console.log(req.session.userOTP)
        res.render('user/otp', { otp: req.session.userOTP })

        
    }
    catch(err){
        logger.info(err)
        logger.info("failed to get the otp page")
        res.status(500).json({ success: false, message: "something went wrong (otp page)"})
    }
}

// to verify the otp
const verifyOtp = async (req, res) => {
    try{
        const { otp } = req.body
        
        console.log("this is working - otp: ", otp)
        console.log("this is session: ", req.session.userOTP)

        if(Date.now() > req.session.userOTP.expiryAt){
            console.log("otp expired------------")
            return res.status(400).json({success: false, message: "invalid OTP, please try again"})
        }
        
        if(otp == req.session.userOTP.otp){
            
            const user = req.session.userData
            const hashedPassword = await bcrypt.hash(user.password, salt)
            var referral = rndm.base62(10)

            const saveUser = new userSchema({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                isListed: true,
                referral
            })

            await saveUser.save()
            req.session.user = saveUser._id        
            
            // creating a wishlist for the user
            await wishlistSchema.create({
                userId: saveUser._id,
                items: []
            })
            
            // creating a wallet for the user based on the referral code the user enter
            const userWithReferralCode = await userSchema.findOne({referral: user.referral})
            if(userWithReferralCode){
                await walletSchema.create({
                    balance: 10000,
                    userId: saveUser._id,
                })
                await walletSchema.findOneAndUpdate({userId: userWithReferralCode._id}, {$inc: {balance: +10000}})
            }
            else{
                await walletSchema.create({
                    userId: saveUser._id,
                })
            }

            const coupon = await couponSchema.findOne({code: "WELCOME15"})
            if(coupon){
                await userCouponSchema.create({
                    userId: saveUser._id,
                    couponId: coupon._id,
                    startDate: Date.now(),
                    endDate: Date.now() + ((60 * 1000) * 60 * 24 * 3) 
                })
            }

            return res.redirect('/')
        }
        else{
            res.status(400).json({success: false, message: "invalid OTP, please try again"})
        }
    }
    catch(err){
        console.error("failed to verify otp", err)
        res.status(500).json({success: false, message: "something went wrong (verify otp)"})
    }
}

// to resend the otp
const resendOtp = async (req, res) => {
    logger.info("resend is working ...........")
    try{
        const { email } = req.session.userData
        
        if(!email){
            res.status(404).json({messsage: "email not found in the session, register again"})
        }

        const otp = generateOtp()

        req.session.userOTP = {
            otp,
            expiryAt: Date.now() + 60 * 1000
        }
        console.log(otp)

        
        const emailSent = await sendVerificationEmail(email, otp)
        
        if(emailSent){
            res.status(200).json({success: true, message: "resend OTP successful"})
        }
        else{
            res.status(500).json({success: false, message: "resend OTP failed"})
        }
        
        // return res.redirect('/otp')
    
    }
    catch(err){
        console.log(err)
        console.log("failed to resend OTP")
        res.status(500).json({success: false, message: "something went wrong (resend OTP)"})
    }
}

// to get the home page
const getHomePage = async (req, res) => {
    try{
        const userId = req.session.user || req.session?.passport?.user
        const inOffer = await variantSchema.aggregate([
            {$lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "productDoc"
            }},
            { $unwind: "$productDoc" },
            { $match: { "productDoc.discount": {$gte: 20} } },
            { $lookup: {
                from: "categories",
                localField: "productDoc.categoryId",
                foreignField: "_id",
                as: "categoryDoc"
            } },
            { $unwind: "$categoryDoc" },
            {$lookup: {
                from: "brands",
                localField: "productDoc.brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"},
            {$match: { isListed: true, "productDoc.isListed": true, "categoryDoc.isListed": true, "brand.isListed": true }},
            {$addFields: {
                discount: {$max: ["$product.discount", "$category.discount", "$brand.discount"]}
            }},
            { $sample: { size: 5 }}
        ])
        
        const newArrivals = await variantSchema.aggregate([
            {$sort: {_id: -1}},
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
            {$match: { isListed: true, "productDoc.isListed": true, "categoryDoc.isListed": true, "brand.isListed": true }},
            {$addFields: {
                discount: {$max: ["$productDoc.discount", "$categoryDoc.discount", "$brand.discount"]}
            }},
            {$sample: {size: 10}}
        ])

        const wishlist = await wishlistSchema.findOne({userId})
        
        res.render('user/home', { newArrivals, inOffer, wishlist })
    }
    catch(err){
        console.log(err)
        console.log("failed to get the home page")
        res.status(500).json({success: false, message: "something went wrong (get home page)"})
    }
}

// to logout
const logout = async (req, res) => {
    try{
        req.session.user = null
        req.session.passport = null

        res.redirect('/login')
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to logout")
        res.status(500).json({success: false, message: "something went wrong (user logout)"})
    }
}

// to get the product detail page
const productDetail = async (req, res) => {
    try{
        const userId = req.session.user || req. session?.passport?.user
        const { productId } = req.params

        const variant = await variantSchema.aggregate([
            {$match: {_id: new Types.ObjectId(productId) }},
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
            {$addFields: {
                discount: {$max: ["$productDoc.discount", "$categoryDoc.discount", "$brand.discount"]}
            }},
        ])

        if(variant.length<=0){
            logger.fatal("condition")
            return res.status(404).render('pageNotFound')
        }

        const exploreMore = await variantSchema.aggregate([
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
            {$addFields: {
                discount: {$max: ["$productDoc.discount", "$categoryDoc.discount", "$brand.discount"]}
            }},
            {$match: { isListed: true, "productDoc.isListed": true, "categoryDoc.isListed": true }},
            {$sample: {size: 10}}
        ])

        const wishlist = await wishlistSchema.findOne({userId})

        const variantOptions = await variantSchema.find({productId: variant[0].productDoc._id })

        res.render('user/productDetail', { variant, exploreMore, variantOptions, wishlist })

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get the product details page")
        res.status(500).json({success: false, message: "something went wrong (get product details)"})
    }
}

const newArrivals = async (req, res) => {
    try{
        const userId = req.session.user || req.session?.passport?.user
        const filter = {}
        const toSort = {}

        if(req.session.filter){
            const { category, brand, min, max, sort } = req.session.filter
    
            if(category?.length){
                filter["category.name"] = {$in: category}
            }
            if(brand?.length){
                filter["brand.name"] = {$in: brand}
            }
            if(min || max){
                if(min=="" && max!="") filter.price = {$gte: 0, $lte: +max}            
                if(min!="" && max=="") filter.price = {$gte: +min, $lte: Infinity}            
                if(min!="" && max!="") filter.price = {$gte: +min, $lte: +max}
            }
            if(sort){
                if(sort=="none") toSort.$sort = {"natural": 1}
    
                else if(sort=="h-l") toSort.$sort = {price: -1}
                else if(sort=="l-h") toSort.$sort = {price: 1}
                
                else if(sort=="a-z") toSort.$sort = {"product.name": 1}
                else if(sort=="z-a") toSort.$sort = {"product.name": -1}
            }
        }
        else{
            toSort.$sort = {"natural": 1}
        }
     
        const variantCount = await variantSchema.countDocuments()
        const limit = 12

        const allProducts = await variantSchema.aggregate([
            {$sort: {_id: -1}},
            {$lookup: {
                from: "products",
                localField: "productId",
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
            {$match: { isListed: true, "product.isListed": true, "category.isListed": true, "brand.isListed": true }},
            {$match: filter},
            {$sample: {size: limit}},
            toSort,
            {$addFields: {
                discount: {$max: ["$product.discount", "$category.discount", "$brand.discount"]}
            }},
            {$limit: limit},
        ])

        const wishlist = await wishlistSchema.findOne({userId})
        const category = await categorySchema.find({isListed: true}, {name: 1})
        const brand = await brandSchema.find({isListed: true}, {name: 1})

        if(allProducts.length < limit){
            req.session.filter = null
            return res.status(200).render('user/newArrivals', { allProducts, category, brand, wishlist, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        if(limit>=variantCount){
            req.session.filter = null
            console.log("inside condition")
            return res.status(200).render('user/newArrivals', { allProducts, category, brand, wishlist,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        req.session.filter = null
        res.status(200).render('user/newArrivals', { allProducts, category, brand, wishlist,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })

    }
    catch(err){
        logger.log(err)
        logger.log("failed to get new arrivals page")
        res.status(500).json({success: false, message: "something went wrong (get new arrivals)"})
    }
}

module.exports = {
    // pageNotFound,
    loadRegister,
    registerUser,
    loadLogin,
    loginPost,
    loadOtpPage,
    verifyOtp,
    resendOtp,
    getHomePage,
    logout,
    productDetail,
    newArrivals
}