const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')

const logger = require("../../config/logger.js")


const searchResult = async (req, res) => {
    try {

        const { name } = req.query
        
        const filter = {}
        const toSort = {}

        if(req.session.searchFilter){
            const { category, brand, min, max, sort } = req.session.searchFilter
    
            if(category?.length){
                filter["category.name"] = {$in: category}
            }
            if(brand?.length){
                filter["brand.name"] = {$in: brand}
            }
            if(min || max){
                if(min=="" && max!="") filter.price = {$gte: 0, $lte: +max}            
                if(min!="" && max=="") filter.price = {$gte: +min, $lte: Infinity}            
                if(min!="" && max!="") filter.price = {$gte: +min, $lte: +max}
            }
            if(sort){
                if(sort=="none") toSort.$sort = {"natural": 1}
    
                else if(sort=="h-l") toSort.$sort = {price: -1}
                else if(sort=="l-h") toSort.$sort = {price: 1}
                
                else if(sort=="a-z") toSort.$sort = {"product.name": 1}
                else if(sort=="z-a") toSort.$sort = {"product.name": -1}
            }
        }
        else{
            toSort.$sort = {"natural": 1}
        }
     
        const productCount = await productSchema.countDocuments()
        const limit = 12

        const allProducts = await variantSchema.aggregate([
            {$lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product"
            }},
            {$unwind: "$product"},
            {$lookup: {
                from: "categories",
                localField: "product.categoryId",
                foreignField: "_id",
                as: "category"
            }},
            {$unwind: "$category"},
            {$lookup: {
                from: "brands",
                localField: "product.brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"},
            {$match: {"product.name": name}},
            {$match: { isListed: true, "product.isListed": true, "category.isListed": true, "brand.isListed": true }},
            {$match: filter},
            // {$sample: {size: limit}},
            toSort,
            // {$limit: limit},
        ])

        // console.log(allProducts)
        // console.log(filter)
        // console.log(toSort)
        // console.log(name)

        const category = await categorySchema.find({isListed: true}, {name: 1})
        const brand = await brandSchema.find({isListed: true}, {name: 1})

        if(allProducts.length < limit){
            req.session.searchFilter = null
            return res.status(200).render('searchResult', { allProducts, category, brand, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        if(limit>=productCount){
            req.session.searchFilter = null
            return res.status(200).render('searchResult', { allProducts, category, brand,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        req.session.searchFilter = null
        res.status(200).render('searchResult', { allProducts, category, brand,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })

    } 
    catch (err) {
        console.log(err)    
        console.log("failed to get all products page")
        res.status(500).json({success: false, message: "something went wrong (all products page)"})
    }
}

const searchFilter = async (req, res) => {
    try{
        const { category, brand, min, max, sort } = req.body

        req.session.searchFilter = {
            category, brand, min, max, sort
        }

        return res.status(200).json({success: true, message: "filter on search page post successfull"})
    }
    catch(err){
        console.log(err)
        console.log("failed to filter on search page")
        res.status(500).json({success: false, message: "something went wrong (filter on search page)"})
    }
}


module.exports = {
    searchResult,
    searchFilter
}