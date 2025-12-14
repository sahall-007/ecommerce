const userSchema = require('../../model/userSchema.js')
const walletSchema = require('../../model/walletSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const orderSchema = require('../../model/orderSchema.js')
const env = require('dotenv').config()
const { Types } = require('mongoose')

const logger = require("../../config/pinoLogger.js")


const getWalletPage = async (req, res) => {
    try{    
        const userId = req.session.user || req.session?.passport?.user
        const user = await userSchema.findOne({_id: userId})  
        
        if(!user){
            return res.status(404).redirect('/login')
        }
        
        const wallet = await walletSchema.findOne({userId: userId})

        console.log(wallet)

        res.status(200).render('user/wallet', {wallet})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get wallet page")
        res.status(500).json({success: false, message: "something went wrong (wallet page)"})
    }
}


module.exports = {
    getWalletPage
}
