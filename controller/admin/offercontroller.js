
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')

const logger = require('../../config/pinoLogger.js')

const addOfferPage = async (req, res) => {
    try{

        const category = await categorySchema.find()
        const brand = await brandSchema.find()
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
        let { product, category, brand, discount } = req.body

        const bulkOp = product.map(ele => {
            return{
                updateOne: {
                    filter: {name: ele},
                    update: {$set: {discount: discount}}
                }
            }
        })

        if(!discount) return res.status(400).json({success: false, message: "enter a discount number"})
        if(discount<0 || discount>100) return res.status(400).json({success: false, message: "enter a valid discount number from 1 to 100"})
        if(product.length>0) await productSchema.bulkWrite(bulkOp)    
        if(category) await categorySchema.findOneAndUpdate({name: category}, {discount})
        if(brand) await brandSchema.findOneAndUpdate({name: brand}, {discount})

        res.status(200).json({success: true, mesage: "offer added successfully"})
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to post add offer")
        res.status(500).json({message: "something went wrong (add offer post)"})
    }
}

module.exports = {
    addOfferPage,
    search,
    addOfferPost
}