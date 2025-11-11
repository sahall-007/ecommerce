const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')

const allProducts = async (req, res) => {
    try {
        const allProducts = await variantSchema.aggregate([
            {$sort: {_id: -1}},
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
            {$match: { isListed: true, "product.isListed": true, "category.isListed": true }},
            {$sample: {size: 20}}
        ])

        res.status(200).render('allProducts', { allProducts })

    } 
    catch (err) {
        console.log(err)    
        console.log("failed to get all products page")
        res.status(500).josn({success: false, message: "something went wrong (all products page)"})
    }
}

const filter = async (req, res) => {
    try{
        const { category, brand, min, max, sort } = req.body

        req.session.filter = {
            category, brand, min, max, sort
        }

        // console.log(req.body)
        
        // const filter = {}
        // const toSort = {}
        // // const toSortProduct = {}

        // if(category.length){
        //     filter["category.name"] = {$in: category}
        // }
        // if(brand.length){
        //     filter["brand.name"] = {$in: brand}
        // }
        // if(min || max){
        //     if(min=="" && max!="") filter.price = {$gte: 0, $lte: +max}            
        //     if(max=="" && min!="") filter.price = {$gte: +min, $lte: Infinity}            
        //     if(min!="" && max!="") filter.price = {$gte: +min, $lte: +max}
        // }

        // if(sort){
        //     if(sort=="none") toSort.$sort = {"natural": 1}

        //     else if(sort=="h-l") toSort.$sort = {price: -1}
        //     else if(sort=="l-h") toSort.$sort = {price: 1}
            
        //     else if(sort=="a-z") toSort.$sort = {"product.name": 1}
        //     else if(sort=="z-a") toSort.$sort = {"product.name": -1}
        //     // if(sort=="none") toSort.$sort = {"natural": 1}
        // }
        

        // const products = await variantSchema.aggregate([
        //     {$lookup: {
        //         from: "products",
        //         localField: "productId",
        //         foreignField: "_id",
        //         as: "product"
        //     }},
        //     {$unwind: "$product"},
        //     {$lookup: {
        //         from: "categories",
        //         localField: "product.categoryId",
        //         foreignField: "_id",
        //         as: "category"
        //     }},
        //     {$unwind: "$category"},
        //     {$lookup: {
        //         from: "brands",
        //         localField: "product.brandId",
        //         foreignField: "_id",
        //         as: "brand"
        //     }},
        //     {$unwind: "$brand"},
        //     {$match: filter},
        //     toSort,
        // ])

        // req.session.filterProducts = products

        return res.status(200).json({success: true, message: "filter post successfull"})

    }
    catch(err){
        console.log(err)
        console.log("failed to filter")
        res.status(500).json({success: false, message: "something went wrong (filter)"})
    }
}

const filterPage = async (req, res) => {
    try{

        // const filterpro = req.session.filter

        const { category, brand, min, max, sort } = req.session.filter

        

        // console.log(category, brand, min, max, sort)

        const filter = {}
        const toSort = {}

        if(category.length){
            filter["category.name"] = {$in: category}
        }
        if(brand.length){
            filter["brand.name"] = {$in: brand}
        }
        if(min || max){
            if(min=="" && max!="") filter.price = {$gte: 0, $lte: +max}            
            if(max=="" && min!="") filter.price = {$gte: +min, $lte: Infinity}            
            if(min!="" && max!="") filter.price = {$gte: +min, $lte: +max}
        }

        if(sort){
            if(sort=="none") toSort.$sort = {"natural": 1}

            else if(sort=="h-l") toSort.$sort = {price: -1}
            else if(sort=="l-h") toSort.$sort = {price: 1}
            
            else if(sort=="a-z") toSort.$sort = {"product.name": 1}
            else if(sort=="z-a") toSort.$sort = {"product.name": -1}
        }
        

        const products = await variantSchema.aggregate([
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
            {$match: filter},
            toSort,
        ])

        res.status(200).render('allProducts', { allProducts: products})

    }
    catch(err){
        console.log(err)
        console.log("failed to get filter page")
        res.status(500).json({success: false, message: "something went wrong (filter page)"})
    }
}

const search = async (req, res) => {
    try{
        const { search } = req.body

        console.log(search)

        let filter = search.split("").map(ele => `(?=.*${ele})`).join("")

        let regex = new RegExp(`^${filter}.*$`)

        const product = await productSchema.find({name: {$regex: regex, $options: 'i'}}, {name: 1})

        const variant = await variantSchema.aggregate([
            {$lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product"
            }},
            {$unwind: "$product"},
            {$match: {"product.name": {$regex: regex, $options: 'i'}}},
            {$project: {"product.name": 1, _id: 1}}
        ])

        console.log(variant)

        res.status(200).json({variant, success: true, message: "search success"})
    }
    catch(err){
        console.log(err)
        console.log("failed to search")
        res.status(500).json({success: false, message: "something went wrong (search)"})
    }
}


module.exports = {
    allProducts,
    filter,
    filterPage,
    search
}