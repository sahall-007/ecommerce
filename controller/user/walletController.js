const userSchema = require('../../model/userSchema.js')
const walletSchema = require('../../model/walletSchema.js')

const logger = require("../../config/pinoLogger.js")
const { Types } = require('mongoose')

const getWalletPage = async (req, res) => {
    try{    
        const userId = req.session.user || req.session?.passport?.user
        const user = await userSchema.findOne({_id: userId})  
        const limit = 5
        
        if(!user){
            return res.status(404).redirect('/login')
        }

        const toFindTransactionCount = await walletSchema.findOne({userId: userId})
        const walletCount = toFindTransactionCount?.transactions?.length
        
        const wallet = await walletSchema.aggregate([
            {$match: {userId: new Types.ObjectId(userId)}},
            {$unwind: "$transactions"},
            {$sort: {"transactions._id": -1}},
            {$limit: limit}
        ])

        console.log(wallet)

        if (limit >= walletCount) {
            return res.status(200).render('user/wallet', { wallet, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('user/wallet', { wallet, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })

        // res.status(200).render('user/wallet', {wallet})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get wallet page")
        res.status(500).json({success: false, message: "something went wrong (wallet page)"})
    }
}

const pagination = async (req, res) => {
    try{
        const userId = req.session?.user || req.session?.passport?.user
        const { page } = req.params
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/wallet')
        }

        const toFindTransactionCount = await walletSchema.findOne({userId: userId})
        const walletCount = toFindTransactionCount?.transactions?.length

        const wallet = await walletSchema.aggregate([
            {$match: {userId: new Types.ObjectId(userId)}},
            {$unwind: "$transactions"},
            {$sort: {"transactions._id": -1}},
            {$skip: limit * pageNo},
            {$limit: limit}
        ])

        if(pageNo * limit + limit >= walletCount){
            res.render('user/wallet', { wallet, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{           
            res.render('user/wallet', { wallet, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }

    }
    catch(err){
        console.log(err)
        console.log("failed to retrieve next page")
        res.status(500).json({message: "something went wrong, (category next page)"})
    }
}

module.exports = {
    getWalletPage,
    pagination
}
