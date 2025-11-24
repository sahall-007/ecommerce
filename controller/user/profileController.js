const userSchema = require('../../model/userSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const { Types } = require('mongoose')

const logger = require("../../config/pinoLogger.js")

function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
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

const profilePage = async (req, res) => {
    try{

        const id = req.session.user || req.session?.passport?.user
        
        logger.info(id)

        const user = await userSchema.findOne({_id: id})

        // logger.info(user)

        res.render('user/profile', {user})
    }
    catch(err){
        console.log(err)
        console.log("failed to get profile page")
        res.status(500).json({success: false, message: "something went wrong (get profile page)"})
    }
}

const editProfile = async (req, res) => {
    try{

        const user = await userSchema.findOne({_id: req.session.user})
        logger.info({user}, "this is user: ")
        if(!user){
            return res.status(404).json({success: false, message: "user not found in the database"})
        }

        const { username, phone } = req.body
        
        await userSchema.findByIdAndUpdate({_id: req.session.user}, {username})

        const result = await userSchema.findOne({_id: req.session.user})

        logger.info({result}, "final user")

        res.status(200).json({success: true, message: "success"})
        // const { username, phone } = req.body



    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to edit profile")
        res.status(500).json({success: false, message: "something went wrong (edit profile post)"})
    }
}

const changeEmailPage = async (req, res) => {
    try{
        res.render('user/changeEmail')
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to load change email page")
        res.status(500).json({success: false, message: "something went wrong (change email page)"})
    }
}

const changeEmailPost = async (req, res) => {
    try{
        const { email } = req.body

        const user = await userSchema.findOne({email})

        if(!user){
            return res.status(404).json({success: false, message: "email not found in the database"})
        }

        if(user){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)
            if(emailSent){
                req.session.changeEmailOtp = {
                    otp, 
                    expiryAt: Date.now() + 60 * 1000
                }
                req.session.changingEmail = email
                logger.info(otp, "OTP: ")
                return res.status(200).json({success: true, message: "successfully send otp"})
            }
            else{
                res.status(500).json({success: false, message: "failed to send otp, please try again"})
            }
        }
        else{
            res.render('user/changeEmail')
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post change email")
        res.status(500).json({success: false, message: "something went wrong (change email post)"})
    }
}

const getOtpPage = async (req, res) => {
    try{
        res.render('user/changeEmailOtp')
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get email change OTP page")
        res.status(500).json({success: false, message: "something went wrong (change email OTP page)"})
    }
}

const otpPost = async (req, res) => {
    try{
        const { otp } = req.body

        if(Date.now() > req.session.changeEmailOtp.expiryAt){
            logger.warn("change email otp expired------")
            return res.status(400).json({success: false, message: "otp expired please resend it and try again"})
        }

        if(otp == req.session.changeEmailOtp.otp){
            return res.status(200).json({success: true, message: "otp verified successfully"})
        }
        else{
            res.status(400).json({success: false, message: "invalid otp, please try again"})
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post email change OTP ")
        res.status(500).json({success: false, message: "something went wrong (change email OTP Post)"})
    }
}

const changeEmailresendOtp = async (req, res) => {
    try{
        const email = req.session.changingEmail

        const user = await userSchema.findOne({email})
        if(!user){
            return res.status(404).json({success: false, message: "user not found"})
        }

        const otp = generateOtp()

        req.session.changeEmailOtp = {
            otp,
            expiryAt: Date.now() + 60 * 1000
        }
        logger.info(`resend otp (change email): ${otp}`)
        
        const emailSent = await sendVerificationEmail(email, otp)
        
        if(emailSent){
            res.status(200).json({success: true, message: "resend OTP successful"})
        }
        else{
            res.status(500).json({success: false, message: "resend OTP failed"})
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to resednd change email otp ")
        res.status(500).json({success: false, message: "something went wrong (resend change email OTP Post)"})
    }
}

const newEmailPage = async (req, res) => {
    try{
        res.render('user/newEmail')
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get new email changepage ")
        res.status(500).json({success: false, message: "something went wrong (new email page)"})

    }
}

const newEmailPost = async (req, res) => {
    try{
        const { email } = req.body

        const user = await userSchema.findOne({email})

        if(user){
            return res.status(409).json({success: false, message: "email already in use, enter another one"})
        }

        if(!user){
            req.session.newEmail = email
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)
            if(emailSent){
                req.session.changeEmailOtp = {
                    otp, 
                    expiryAt: Date.now() + 60 * 1000
                }
                logger.info(otp, "OTP: ")
                return res.status(200).json({success: true, message: "successfully send otp"})
            }
            else{
                res.json({success: false, message: "failed to send otp, please try again"})
            }
        }
        // else{
        //     res.render('user/changeEmail')
        // }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post new email changepage ")
        res.status(500).json({success: false, message: "something went wrong (new email post)"})
    }
}

const newEmailOtpPage = async (req, res) => {
    try{
        res.render('user/newEmailotp')
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get new email OTP page")
        res.status(500).json({success: false, message: "something went wrong (new email OTP page)"})
    }
} 

const newEmailOtpPost = async (req, res) => {
    try{
        const { otp } = req.body

        if(Date.now() > req.session.changeEmailOtp.expiryAt){
            logger.warn("change email otp expired------")
            return res.status(400).json({success: false, message: "otp expired please resend it and try again"})
        }

        if(otp == req.session.changeEmailOtp.otp){
            const email = req.session.changingEmail
            const newEmail = req.session.newEmail

            await userSchema.findOneAndUpdate({email: email}, {$set: {email: newEmail}})
            return res.status(200).json({success: true, message: "otp verified successfully"})
        }
        else{
            res.status(400).json({success: false, message: "invalid otp, please try again"})
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post new email OTP ")
        res.status(500).json({success: false, message: "something went wrong (new email OTP Post)"})
    }
}

const newEmailResendOtp = async (req, res) => {
    try{
        const email = req.session.newEmail

        // const user = await userSchema.findOne({email})
        // if(!user){
        //     return res.status(404).json({success: false, message: "user not found"})
        // }

        const otp = generateOtp()

        req.session.changeEmailOtp = {
            otp,
            expiryAt: Date.now() + 60 * 1000
        }
        logger.info(`resend otp (new email): ${otp}`)
        
        const emailSent = await sendVerificationEmail(email, otp)
        
        if(emailSent){
            res.status(200).json({success: true, message: "resend OTP successful"})
        }
        else{
            res.status(500).json({success: false, message: "resend OTP failed"})
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to resend new email OTP ")
        res.status(500).json({success: false, message: "something went wrong (resend new email OTP Post)"})
    }
}

const updatePassword = async (req, res) => { 
    try{
        const { password, newPassword, confirmPassword } = req.body
        const userId = req.session.user

        logger.warn(userId, "thsi is user id")

        if(newPassword!=confirmPassword){
            return res.status(400).json({success: false, message: "new password does not match confirm password"})
        }

        const user = await userSchema.findOne({_id: userId})
        
        if(!user){
            return res.status(404).json({success: false, message: "user not found"})
        }

        logger.warn(password)
        logger.warn(user.password)

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.status(400).json({success: false, message: "Invalid current password"})
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        logger.warn(hashedPassword)

        await userSchema.findOneAndUpdate({_id: userId}, {$set: {password: hashedPassword}})
        res.status(200).json({success: true, message: "successfully updated password"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to update password ")
        res.status(500).json({success: false, message: "something went wrong (update password)"})
    }
}

const profileImage = async (req, res) => {
    try{
        const { id } = req.params

        let user = await userSchema.findOne({_id: id})

        if(!user){
            return res.status(404).json({success: false, message: "cannot find the user"})
        }

        let path = req.file.path.replace(/\\/g, '/')
        logger.info(req.file)
        logger.info(path)

        await userSchema.findOneAndUpdate({_id: id}, {image: path})
        res.status(200).json({success: true, message: "successfully added the profile image"})


    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to add profile image")
        res.status(500).json({success: false, message: "something went wrong (add profile image)"})
    }
}

module.exports = {
    profilePage,
    editProfile,
    changeEmailPage,
    changeEmailPost,
    getOtpPage,
    otpPost,
    changeEmailresendOtp,
    newEmailPage,
    newEmailPost,
    newEmailOtpPage,
    newEmailOtpPost,
    newEmailResendOtp,
    updatePassword,
    profileImage
}

