

const userSchema = require('../../model/userSchema.js')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const session = require('express-session')

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
        const { email } = req.body
        
        const finduser = await userSchema.findOne({email})

        if(finduser){
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)
            if(emailSent){
                req.session.userOtp = otp
                req.session.email = email
                res.render('forgotPassOtp')
                console.log("OTP: ", otp)
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

module.exports = {
    forgotPassPage,
    forgotEmailValidation
}