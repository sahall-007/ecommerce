const userSchema = require('../../model/userSchema.js')
const walletSchema = require('../../model/walletSchema.js')

const logger = require("../../config/pinoLogger.js")

const getWalletPage = async (req, res) => {
    try{    
        const userId = req.session.user || req.session?.passport?.user
        const user = await userSchema.findOne({_id: userId})  
        
        if(!user){
            return res.status(404).redirect('/login')
        }
        
        const wallet = await walletSchema.findOne({userId: userId})

        res.status(200).render('user/wallet', {wallet: wallet})

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
