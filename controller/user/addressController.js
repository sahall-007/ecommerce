const userSchema = require('../../model/userSchema.js')
const addressSchema = require('../../model/addressSchema.js')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const { Types, default: mongoose } = require('mongoose')

const logger = require("../../config/pinoLogger.js")


const addressPage = async (req, res) => {
    try {
        const id = req.session.user || req.session?.passport?.user

        // const userExist = await userSchema.aggregate([
        //     { $match: { _id: new Types.ObjectId(id) } },
        //     {
        //         $lookup: {
        //             from: "addresses",
        //             localField: "_id",
        //             foreignField: "userId",
        //             as: "address"
        //         }
        //     },
        //     // { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } }
        // ])

        const address = await addressSchema.findOne({userId: id})

        // const user = userExist[0]

        // if (!user) {
        //     return res.status(404).render('pageNotFound')
        // }

        // logger.info({ address })

        res.status(200).render('user/address', { address })
    }
    catch (err) {
        logger.fatal(err)
        logger.fatal("failed to get address Page")
        res.status(500).json({ success: false, message: "something went wrong (address page)" })
    }
}

const addressPost = async (req, res) => {
    try {
        const { fullname, phone, email, pincode, address, city, state,  addressType } = req.body
        const id = req.session.user || req.session?.passport?.user

        const user = await userSchema.findOne({_id: id})
        if(!user){
            return res.status(404).render('pageNotFound', (err, html) => {
                res.json({html})
            })
        }
        const userAddress = await addressSchema.findOne({userId: user._id})

        if(userAddress){
            userAddress.billingAddress.push({fullname, phone, email, pincode, address, addressType, city, state, isSelected: false})
            await userAddress.save();
        }
        else{
            const newAddress = new addressSchema({
                userId: id,
                billingAddress: [{fullname, phone, email, address, pincode, addressType, city, state, isSelected: false}]
            })
            await newAddress.save()
        }

        const updated = await addressSchema.findOne({userId: user._id})

        // logger.info({updated}, "successfully created address")

        res.status(200).json({success: true, messaeg: "successfully added address"})

    
    }
    catch (err) {
        logger.fatal(err)
        logger.fatal("failed to post add new address")
        res.status(500).json({ success: false, message: "something went wrong (new address post)" })
    }
}

const selectAddress = async (req, res) => {
    try{
        const { index, addressId } = req.body

        const userAddress = await addressSchema.findOne({_id: addressId})

        userAddress.billingAddress.forEach((ele) => {
            ele.isSelected = false
        })

        userAddress.billingAddress[index].isSelected = true
        await userAddress.save()

        res.status(200).json({success: true, message: "successfully selected a new address"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to select new address")
        res.status(500).json({ success: false, message: "something went wrong (selsect new address post)" })
    }
}

const deleteAddress = async (req, res) => {
    try{
        const { index, addressId } = req.body

        const address = await addressSchema.findOne({_id: addressId}, {billingAddress: 1})

        // const deleteAddress = await addressSchema.updateOne({_id: addressId}, {$pull: {billingAddress: {_id: address.billingAddress[index]._id}}})
        const deleteAddress = await addressSchema.updateOne({_id: addressId}, {$pull: {billingAddress: address.billingAddress[index]}})

        res.status(200).json({success: true, message: "successfully deleted the address"})


    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to select new address")
        res.status(500).json({ success: false, message: "something went wrong (selsect new address post)" })
    }
}

const editAddressPage = async (req, res) => {
    try{
        const { index, addressId } = req.params

        const address = await addressSchema.findOne({_id: addressId})

        if(!address || index >= address.billingAddress.length){
            return res.status(404).render('pageNotFound')
        }

        res.render('user/editAddress', {address, index})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to edit address page")
        res.status(500).json({ success: false, message: "something went wrong (edit address page)" })
    }
}

const editAddressPatch = async (req, res) => {
        logger.info("reached handler")

    try{
        const { fullname, phone, email, pincode, address, city, state, addressType, isSelected, addressId, index } = req.body
        const id = req.session.user

        // const user = await userSchema.findOne({_id: id})
        // if(!user){
        //     return res.status(404).render('pageNotFound', (err, html) => {
        //         res.json({html})
        //     })
        // }
        const userAddress = await addressSchema.findOne({_id: addressId})

        if(!userAddress){
            return res.status(404).render('pageNotFound', (err, html) => {
                return res.json({html})
            })
        }

        userAddress.billingAddress[index] = { fullname, phone, email, pincode, address,city, state, addressType, isSelected }

        await userAddress.save()

        logger.info("successfully edited")

        res.status(200).json({success: true, messaage: "successfully edited the address"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to edit address patch")
        res.status(500).json({ success: false, message: "something went wrong (edit address patch)" })
    }
}

module.exports = {
    addressPage,
    addressPost,
    selectAddress,
    deleteAddress,
    editAddressPage,
    editAddressPatch
}