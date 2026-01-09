
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')
const offerSchema = require('../../model/offerSchema.js')
const offerTargetSchema = require('../../model/offerTargetSchema.js')

const mongoose = require('mongoose')

const logger = require('../../config/pinoLogger.js')

const offerManagement = async (req, res) => {
    try{

        const offerCount = await offerSchema.countDocuments()
        const limit = 5
        const offers = await offerSchema.find().sort({_id: -1}).limit(limit)

        if (limit >= offerCount) {
            return res.status(200).render('admin/offerManagement', { offers, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('admin/offerManagement', { offers, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get order management page")
        res.status(500).json({success: false, message: "something went wrong (offer management page)"})
    }
}

const addOfferPage = async (req, res) => {
    try{

        const category = await categorySchema.find({}, {_id: 1, name: 1})
        const brand = await brandSchema.find({}, {_id: 1, name: 1})
        const product = await productSchema.find()

        res.status(200).render('admin/addOffer', {category, brand, product})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get add offer page")
        res.status(500).json({message: "something went wrong (add offer page)"})
    }
}

const search = async (req, res) => {
    try{
        const { search } = req.body

        let filter = search.split("").map(ele => `(?=.*${ele})`).join("")

        const product = await productSchema.aggregate([
            {$match: {name: {$regex: new RegExp(`^${filter}.*$`), $options: 'i'}}},
            {$lookup: {
                from: "variants",
                let: {id: "$_id"},
                pipeline: [
                    {$match: {$expr: {$eq: ["$$id", "$productId"]}}},
                    {$limit: 1},
                    {$project: {image: 1}}
                ],
                as: "variant"
            }},
            {$unwind: "$variant"},
            {$project: {name: 1, _id: 1, variant: 1}},
          
        ])

        res.status(200).json({product, success: true, message: "search success"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to search product in add offer")
        res.status(500).json({success: false, message: "something went wrong (search product in add offer)"})
    }
}

const addOfferPost = async (req, res) => {
    try{
        let { offerName, discount, offerType, category, brand, product } = req.body
        let targetIds = []
        let products
        let offerFor

        const offerExistCheck = await offerSchema.findOne({offerName: new RegExp(`^${offerName}$`, "i")})

        if(offerExistCheck){
            return res.status(400).json({success: false, message: "offer with this name already exist"})
        }

        if(offerType=="product"){
            targetIds = product         
            
            products = product.map(ele => {
                return {
                    _id: new mongoose.Types.ObjectId(ele)
                }
            })
        }
        else if(offerType=="category"){
            targetIds.push(category)

            products = await productSchema.find({categoryId: category}, {_id: 1})
            const categoryName = await categorySchema.findOne({_id: category}, {name: 1})

            offerFor = categoryName.name
        }
        else if(offerType=="brand"){
            targetIds.push(brand)

            products = await productSchema.find({brandId: brand}, {_id: 1})
            const brandName = await brandSchema.findOne({_id: brand}, {name: 1})

            offerFor = brandName.name
        }

        // to create the main offer
        const offer = await offerSchema.create({
            offerName,
            discount,
            offerType,
            offerFor,
            targetIds,
            isActive: true
        })

        // to make the documents for the offer targets
        const doc = products.map(ele => ({            
            offerId: offer._id,
            productId: ele._id,
            discount: offer.discount,
            isActive: true            
        }))

        const offerTarget = await offerTargetSchema.insertMany(doc)

        if(offerTarget) res.status(200).json({success: true, message: "successfully added new offer"})

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post add offer")
        res.status(500).json({message: "something went wrong (add offer post)"})
    }
}

const editOfferPage = async (req, res) => {
    try{
        const { name } = req.params
        const offer = await offerSchema.findOne({offerName: name}).lean(); 
        
        let targetNames

        if(offer?.offerType=="product"){

            const products = await productSchema.find(
                { _id: { $in: offer.targetIds } },
                { name: 1 }
            )            

            const productMap = new Map(
                products.map(p => [p._id.toString(), p.name])
            );

            targetNames = offer.targetIds.map(id =>
                productMap.get(id.toString()) || null
            );

        }

        const category = await categorySchema.find({}, {_id: 1, name: 1})
        const brand = await brandSchema.find({}, {_id: 1, name: 1})
        const product = await productSchema.find()

        res.status(200).render('admin/editOffer', { 
            editName: offer?.offerName, 
            editDiscount: offer?.discount || 0, 
            offerType: offer.offerType, 
            offerFor: offer?.offerFor,
            targetIds: offer?.targetIds,
            targetNames ,
            category,
            brand,
            product
        })
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to get edit offer page")
        res.status(500).json({success: false, message: "something went wrong (edit offer page)"})
    }
}

const editOfferPost = async (req, res) => {
    try{
        let { offerName, discount, offerType, category, brand, product } = req.body
        const { name } = req.params  

        const offerExistCheck = await offerSchema.findOne({offerName: new RegExp(`^${offerName}$`, "i")})

        if(offerExistCheck){
            return res.status(400).json({success: false, message: "offer with this name already exist"})
        }

        
        let targetIds = []
        let products
        
        if(offerType=="product"){
            targetIds = product         
            
            products = product.map(ele => {
                return {
                    _id: new mongoose.Types.ObjectId(ele)
                }
            })
        }
        else if(offerType=="category"){
            targetIds.push(category)

            products = await productSchema.find({categoryId: category}, {_id: 1})
            const categoryName = await categorySchema.findOne({_id: category}, {name: 1})

        }
        else if(offerType=="brand"){
            targetIds.push(brand)

            products = await productSchema.find({brandId: brand}, {_id: 1})
            const brandName = await brandSchema.findOne({_id: brand}, {name: 1})

        }

        const categoryName = await categorySchema.findOne({_id: category}, {name: 1})
        const brandName = await brandSchema.findOne({_id: brand}, {name: 1})
        const offer = await offerSchema.findOne({offerName: name})

        // let targetIds

        // if(category) targetIds = [category]
        // else if(brand) targetIds = [brand]
        // else if(product.length>0) targetIds = product


        let editingName = offerName || offer.offerName
        let editingDiscount = discount || offer.discount
        let editingCategory = category || offer?.category
        let editingBrand = brand || offer?.brand
        let offerFor = categoryName?.name || brandName?.name || offer?.offerFor

        const edited = await offerSchema.findOneAndUpdate({offerName: name}, {$set: { offerName: editingName, discount: editingDiscount , targetIds,  offerFor}})

        
        
        const bulkOperation = products.map(ele => {
            return {
                updateOne: {
                    "filter": { offerId: edited._id, productId: ele._id },
                    "update": {$set: { discount: editingDiscount, offerId: edited._id, productId: ele._id }},
                    "upsert": true
                }
            }
        })
        const deleteProducts = products.map(ele => ele.name)
        
        
        await offerTargetSchema.deleteMany({offerId: edited._id, productId: {$nin: deleteProducts}})

        await offerTargetSchema.bulkWrite(bulkOperation)
        
        console.log(edited)

        if(edited) return res.status(200).json({success: true, message: "successfully edited the offer"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post edit offer")
        res.status(500).json({success: false, message: "something went wrong (edit offer post)"})
    }
}

const blockOffer = async (req, res) => {
    try{
        const { id } = req.body

        await offerSchema.findOneAndUpdate({_id: id}, {$set: {isActive: false}})
        await offerTargetSchema.updateMany({offerId: id}, {$set: {isActive: false}})

        res.status(200).json({message: "offer has been blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to block the offer")
        res.status(500).json({message: "something went wrong (block offer)"})
    }
}

const unBlockOffer = async (req, res) => {
    try{
        const { id } = req.body

        await offerSchema.findOneAndUpdate({_id: id}, {$set: {isActive: true}})
        await offerTargetSchema.updateMany({offerId: id}, {$set: {isActive: true}})

        res.status(200).json({message: "offer has been unblocked"})

    }
    catch(err){
        console.log(err)
        console.log("failed to unblock user")
        res.status(500).json({message: "something went wrong (unblock category)"})
    }
}

const pagination = async (req, res) => {
    try{
        const { page } = req.params
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/offer')
        }
        const offerCount = await offerSchema.countDocuments()
        const offers = await offerSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        if(pageNo * limit + limit >= offerCount){
            res.render('admin/offerManagement', { offers, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('admin/offerManagement', { offers, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }

    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to retrieve next page")
        res.status(500).json({message: "something went wrong, (category next page)"})
    }
}


module.exports = {
    addOfferPage,
    search,
    addOfferPost,
    offerManagement,
    editOfferPage,
    editOfferPost,
    blockOffer,
    unBlockOffer,
    pagination
}