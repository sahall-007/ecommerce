
const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const { Types } = require('mongoose')

const salt = 10

// to load the register page
const loadRegister = async (req, res) => {
    try {

        if(req.session.matchPass==false){
            req.session.matchPass = true
            return res.status(409).render('register', {confirm: "Password doesn't match, Try again", 
                                                       username: null,
                                                       email: null,
                                                       password: null
            })
        }

        if(req.session.userExist==true){
            req.session.userExist = false
            return res.status(409).render('register', {email: "Email already in use, Try again",
                                                       username: null,                                                
                                                       password: null,
                                                       confirm: null
            })
        }

        res.render('register', {confirm: null,
                                username: null,
                                email: null,
                                password: null
        })
    }
    catch (err) {
        console.log(err)
        console.log("failed to load the register page!")
        res.status(500).json({success: false, message: "something went wrong (register page)"})
    }
}

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

// to validate the register details from the user
const registerUser = async (req, res) => {
    try {

        const { username, email, password, confirm } = req.body

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
            expiryAt: Date.now() + 30*1000
        }
    
        req.session.userData = { username, email, password }

        res.redirect('/otp')

    }
    catch (err) {
        console.log(err)
        console.log("failed to register the user!")
        res.status(500).json({success: false, message: "something went wrong (reigster post)"})
    }
}

// to load the login pages
const loadLogin = async (req, res) => {
    try {
        res.render('userLogin')
    }
    catch (err) {
        console.log(err)
        console.log("failed to load the login page!")
    }
}

// to verify the login details
const loginPost = async (req, res) => {
    try{
        const { username, email, password } = req.body

        const userExist = await userSchema.find({username})

        if(!userExist){
            return res.status(401).json({success: false, message: "create an account first"})
        }

        const isMatch = await bcrypt.compare(password, userExist[0].password)
        if (!isMatch || userExist[0].username !== username) {
            return res.status(401).redirect('/login')
        }

        req.session.user = userExist[0]._id
        res.redirect('/')

    }
    catch(err){
        console.log(err)
        console.log("failed to login")
        res.status(500).json({success: false, message: "something went wrong (post login)"})
    }
}

// to load the otp page
const loadOtpPage = async (req, res) =>{
    try{
        // if(req.session.resend==true){
        //     req.session.userOTP = 654321
        //     req.session.resend = false
        //     return res.render('otp', { otp: req.session.userOTP })    
        // }
        // req.session.userOTP = 123456
        console.log(req.session.userOTP)
        res.render('otp', { otp: req.session.userOTP })

        
    }
    catch(err){
        console.log(err)
        console.log("failed to get the otp page")
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

            const saveUser = await new userSchema({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                isListed: true
            })

            await saveUser.save()
            req.session.user = saveUser._id

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
    console.log("resend is working ...........")
    try{
        const { email } = req.session.userData
        
        if(!email){
            res.status(404).json({messsage: "email not found in the session, register again"})
        }

        const otp = generateOtp()

        req.session.userOTP = {
            otp,
            expiryAt: Date.now() + 30 * 1000
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
            {$match: { isListed: true, "productDoc.isListed": true, "categoryDoc.isListed": true }},
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
            {$match: { isListed: true, "productDoc.isListed": true, "categoryDoc.isListed": true }},
            {$sample: {size: 10}}
        ])

        // console.log(newArrivals)

        // const newArrivalPrice = await variantSchema.aggregate([
        //     {$sort: {_id: -1}},
        //     {limit: 5},
        //     {$group: [
        //         {$}
        //     ]}
        // ])

        
        
        // const populated = await variantSchema.populate(newArrivals, { path: 'productId'})

        // console.log("this is populated offer", populatedOffer)
        
        res.render('home', { newArrivals, inOffer })
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
        console.log(err)
        console.log("failed to logout")
        res.status(500).json({success: false, message: "something went wrong (user logout)"})
    }
}

// to get the product detail page
const productDetail = async (req, res) => {
    try{
        const { id } = req.params

        console.log("working", id)

        // const variant = await variantSchema.find({_id: id}).populate('productId')

        const variant = await variantSchema.aggregate([
            {$match: {_id: new Types.ObjectId(id) }},
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
            {$unwind: "$categoryDoc"}
        ])

        console.log(variant)

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
            {$match: { isListed: true, "productDoc.isListed": true, "categoryDoc.isListed": true }},
            {$sample: {size: 10}}
        ])
        // const populated = await variantSchema.populate(exploreMore, { path: 'productId'})

        const variantOptions = await variantSchema.find({productId: variant[0].productDoc._id })

        // console.log("this is variant options", variantOptions)

        res.render('productDetail', { variant, exploreMore, variantOptions })

    }
    catch(err){
        console.log(err)
        console.log("failed to get the product details page")
        res.status(500).json({success: false, message: "something went wrong (get product details)"})
    }
}


module.exports = {
    loadRegister,
    registerUser,
    loadLogin,
    loginPost,
    loadOtpPage,
    verifyOtp,
    resendOtp,
    getHomePage,
    logout,
    productDetail
}