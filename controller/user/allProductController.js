const userSchema = require('../../model/userSchema.js')
const productSchema = require('../../model/productSchema.js')
const variantSchema = require('../../model/variantSchema.js')
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const { options } = require('../../routes/user.js')


const allProducts = async (req, res) => {
    try {

        
        const filter = {}
        const toSort = {}

        if(req.session.filter){
            const { category, brand, min, max, sort } = req.session.filter
    
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
     
        const variantCount = await variantSchema.countDocuments()
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
            {$match: { isListed: true, "product.isListed": true, "category.isListed": true, "brand.isListed": true }},
            {$match: filter},
            {$sample: {size: limit}},
            toSort,
            {$limit: limit},
        ])

        console.log(filter)
        console.log(toSort)

        const category = await categorySchema.find({isListed: true}, {name: 1})
        const brand = await brandSchema.find({isListed: true}, {name: 1})

        if(allProducts.length < limit){
            req.session.filter = null
            return res.status(200).render('allProducts', { allProducts, category, brand, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        if(limit>=variantCount){
            req.session.filter = null
            console.log("inside condition")
            return res.status(200).render('allProducts', { allProducts, category, brand,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        req.session.filter = null
        res.status(200).render('allProducts', { allProducts, category, brand,  nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })

    } 
    catch (err) {
        console.log(err)    
        console.log("failed to get all products page")
        res.status(500).json({success: false, message: "something went wrong (all products page)"})
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

        const { category, brand, min, max, sort } = req.session.filter

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
            if(sort=="none" || sort==undefined) toSort.$sort = {"natural": 1}

            else if(sort=="h-l") toSort.$sort = {price: -1}
            else if(sort=="l-h") toSort.$sort = {price: 1}
            
            else if(sort=="a-z") toSort.$sort = {"product.name": 1}
            else if(sort=="z-a") toSort.$sort = {"product.name": -1}
        }
        
        const variantCount = await variantSchema.countDocuments()
        let limit = 10
        
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
            {$limit: limit}
        ])

        if(limit >= variantCount){
            return res.status(200).render('allProducts', { allProducts: products, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('allProducts', { allProducts: sample, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })


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

        console.log(filter)

        // let regex = new RegExp(`^${filter}.*$`)

        // const product = await productSchema.find({name: {$regex: regex, $options: 'i'}}, {name: 1})

        const product = await productSchema.aggregate([
            // {$addFields: {productName: {$regexMatch: {input: "$name", regex: new RegExp(`^${filter}.*$`), options: "i"}}}},
            // {$regexMatch: {input: "$name", regex: new RegExp(`^${filter}.*$`), options: "i"}},
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

        // const variant = await variantSchema.aggregate([
        //     {$lookup: {
        //         from: "products",
        //         localField: "productId",
        //         foreignField: "_id",
        //         as: "product"
        //     }},
        //     {$unwind: "$product"},
        //     {$match: {"product.name": {$regex: regex, $options: 'i'}}},
        //     {$project: {"product.name": 1, _id: 1}}
        // ])

        console.log(product)

        res.status(200).json({product, success: true, message: "search success"})
    }
    catch(err){
        console.log(err)
        console.log("failed to search")
        res.status(500).json({success: false, message: "something went wrong (search)"})
    }
}

const nextPage = async (req, res) => {
    try{
        const { page } = req.query
        const pageNo = Number(page)
        const limit = 12

        if(pageNo==0){
            return res.redirect('/allProducts')
        }

        const variantCount = await variantSchema.countDocuments()
        const allProducts = await variantSchema.aggregate([
            {$skip: limit * pageNo},
            {$sort: {_id: 1}},
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
            {$match: { isListed: true, "product.isListed": true, "category.isListed": true, "brand.isListed": true }},
            {$sample: {size: limit}}
        ])

        const category = await categorySchema.find({isListed: true}, {name: 1})
        const brand = await brandSchema.find({isListed: true}, {name: 1})

        if(pageNo * limit + limit >= variantCount){
            res.render('allProducts', { allProducts, category, brand, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('allProducts', { allProducts, category, brand, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }

    }
    catch(err){
        console.log(err)
        console.log("failed to get the next page of all products")
        res.status(500).json({success: false, message: "something went wrong (all products next page)"})
    }
}

const prevPage = async (req, res) => {
    try{
        const { page } = req.query
        
        const pageNo = Number(page)
        const limit = 12

        if(pageNo==0){
            return res.redirect('/allProducts')
        }

        const variantCount = await variantSchema.countDocuments()
        const allProducts = await variantSchema.aggregate([
            {$skip: limit * pageNo},
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
            {$sample: {size: limit}}
        ])

        res.render( 'allProducts', { allProducts, prevPage: pageNo - 1, nextPage: pageNo + 1, prevDisable: null, nextDisable: null})

    }
    catch(err){
        console.log(err)
        console.log("failed to get the previous page of all products")
        res.status(500).json({success: false, message: "something went wrong (all products previous page)"})
    }
}

module.exports = {
    allProducts,
    filter,
    filterPage,
    search,
    nextPage,
    prevPage
}