

const userSchema = require('../../model/userSchema.js')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const session = require('express-session')
const { hasSession } = require('../../middlewares/userAuth.js')

const logger = require("../../config/logger.js")

function generateOtp(){
    const digits = "1234567890"
    let otp = ""
    for(let i=0; i<6; i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }

    return otp
}

const sendVerificationEmail = async (email, otp) => {
    try{
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.APP_EMAIL,
                pass: process.env.APP_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.APP_EMAIL,
            to: email,
            subject: "Your OTP for resetting password",
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4><br><b>`
        }

        const info = await transporter.sendMail(mailOptions)

        console.log("email sent: ", info.messageId)
        
        return true

    }
    catch(err){
        console.log(err)
        console.log("error sending email")
        return false
    }
}

const forgotPassPage = async (req, res) => {
    try{
        res.render('forgotEmail')
    }
    catch(err){
        console.log(err)
        console.log("failed to get forgot password email page")
        res.status(500).json({success: false, message: "something went wrong (forgot password email page)"})
    }
}

const forgotEmailValidation = async (req, res) => {
    try{
        console.log("email validation")
        const { email } = req.body
        
        const finduser = await userSchema.findOne({email})

        if(finduser){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)
            if(emailSent){
                req.session.forgotOtp = {
                    otp,
                    expiryAt: Date.now() + 30 * 10000
                }
                req.session.forgotEmail = email
                // res.render('forgotPassOtp')
                console.log("OTP: ", otp)
                return res.status(200).json({success: true, message: "successfully send otp to the email"})
            }
            else{
                res.json({success: false, message: "failed to send otp, please try again"})
            }
        }
        else{
            res.render("forgotEmail", {message: "usee with this email does not exist"})
        }

    }
    catch(err){
        res.status(500).json({success: false, message: "page not found"})
    }
}

const otpPage = async (req, res) => {
    try{
        if(req.session.forgotEmail==null){
            return res.redirect('/login')
        }
        res.render('forgotPassOtp')
    }
    catch(err){
        console.log(err)
        console.log("failed to get forgot password otp page")
        res.status(500).json({success: false, message: "something went wrong (forgot password otp page)"})
    }
}

const otpPost = async (req, res) => {
    try{
        const { otp } = req.body
        
        
        console.log("this is working - otp: ", otp)
        console.log("this is forgot otp: ", req.session.forgotOtp)

        if(Date.now() > req.session.forgotOtp.expiryAt){
            console.log("otp expired------------")
            return res.status(400).json({success: false, message: "invalid OTP, please try again"})
        }
        
        if(otp == req.session.forgotOtp.otp){
            
            const user = req.session.forgotEmail
            // const hashedPassword = await bcrypt.hash(user.password, salt)

            const userExist = await userSchema.findOne({email: req.session.forgotEmail})

            if(!userExist){
                res.status(404).json({success: false, message: "Email not found in the database"})
            }

            // const saveUser = await new userSchema({
            //     username: user.username,
            //     email: user.email,
            //     password: hashedPassword,
            //     isListed: true
            // })

            // await saveUser.save()
            // req.session.user = saveUser._id

            // return res.redirect('/')
            return res.status(200).json({success: false, message: "OTP verified successfully"})
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

const changePassword = async (req, res) => {
    try{

        if(req.session.forgotEmail==null || req.session.forgotEmail==undefined){
            return res.redirect('/login')
        }
    
        res.render('changePass')
    }
    catch(err){
        console.log(err)
        console.log("failed to get change password page")
        res.status(500).json({success: false, message: "something went wrong (change password page)"})
    }
}

const changePasswordPost = async (req, res) => {

    console.log("working")
    try{
        const { newPass } = req.body
        const email = req.session.forgotEmail
        const userExistCheck = await userSchema.findOne({email})

        if(!userExistCheck){
            return res.status(404).json({success: false, message: "Email not found in the database"})
        }

        const hashedPassword = await bcrypt.hash(newPass, 10)

        const updateUserPass = await userSchema.findOneAndUpdate({email}, {$set: {password: hashedPassword}})

        req.session.forgotEmail = null
        req.session.forgotOtp = null
        return res.status(200).json({success: true, message: "successfully changed that password"})

    }
    catch(err){
        console.log(err)
        console.log("failed to change password Post")
        res.status(500).json({success: false, message: "something went wrong (change passoword post)"})
    }
}

const forgotResendOtp = async (req, res) => {
    console.log("resend is working ...........")
    try{

        const email = req.session.forgotEmail
        
        if(!email){
            return res.status(404).json({messsage: "email not found in the session, register again"})
        }

        const otp = generateOtp()

        req.session.forgotOtp = {
            otp,
            expiryAt: Date.now() + 30 * 10000
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

module.exports = {
    forgotPassPage,
    forgotEmailValidation,
    otpPage,
    otpPost,
    changePassword,
    changePasswordPost,
    forgotResendOtp
}