
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')
const { castObject } = require('../../model/userSchema.js')
const variantSchema = require('../../model/variantSchema.js')

const logger = require('../../config/pinoLogger.js')
const { Types } = require('mongoose')

const productManagement = async (req, res) => { 
    try{
        const productCount = await productSchema.countDocuments()
        let limit = 5

        const products = await productSchema.aggregate([
            {$lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category"
            }},
            {$unwind: "$category"},
            {$lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"},
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
            {$sort: {_id: -1}},
            {$limit: limit}
        ])

        if (limit >= productCount) {
            return res.render('admin/productManagement', { products, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('admin/productManagement', { products, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })
    }
    catch(err){
        console.log(err)
        console.log("failed to get product management page")
        res.status(500).json({success: false, message: "something went wrong (product management)"})
    }
}

const addProductPage = async (req, res) => {
    try{
        const category = await categorySchema.find().sort({_id: -1})
        const brand = await brandSchema.find().sort({_id: -1})

        res.status(200).render('admin/addProduct', { category, brand })
    }
    catch(err){
        console.log(err)
        console.log("failed to get add product page")
        res.status(500).json({error: err, message: "somthing went wrong (get add product page)"})
    }
}

const addProductPost = async (req, res) => {
    try{       

        let totalVariants = 0
        let index =  req.files[0].fieldname.indexOf("-")

        req.files.forEach(element => {
            let id = Number(element.fieldname.slice(index+1))
           
            if(id>totalVariants) totalVariants++
        });

        let images = {}
        for(let i=0; i<req.files.length; i++){

            let path = req.files[i].path.replace(/\\/g, '/')

            if(images[req.files[i].fieldname]){
                images[req.files[i].fieldname].push(path)
            }
            else{
                
                images[req.files[i].fieldname] = [path]
            }
        }

        let keys = Object.keys(images)

        let { name, discount, discription, brand, category, ram, storage, color, quantity, price } = req.body

        if(typeof ram == 'string'){
            console.log("string type check")
            ram = [ram]
            storage = [storage]
            color = [color]
            quantity = [quantity]
            price = [price]
        }

        const categoryDetail = await categorySchema.findOne({name: category}, {name: 1, _id: 1})
        const brandDetail = await brandSchema.findOne({name: brand}, {name: 1, _id: 1})

        if(!categoryDetail){
            return res.stauts(401).json({success: false, message: "cannot find the category"})
        }

        const product = await productSchema.create({
            name,
            discount,
            discription,
            brandId: brandDetail._id,
            categoryId: categoryDetail._id
        })

        let indexOfDash = keys[0].indexOf("-")

        for(let i=0; i<totalVariants; i++){

            let imageFieldName

            for(let j=0; j<keys.length; j++){
                if(Number(keys[j].slice(indexOfDash+1)) == i+1){
                    imageFieldName = keys[j]
                }
            }
            let variantImage = images[imageFieldName]

            await variantSchema.create({
                ram: ram[i],
                storage: storage[i],
                color: color[i],
                quantity: quantity[i],
                price: price[i],
                image: variantImage,
                productId: product._id
            })            
        }

        return res.status(200).json({success: true, message: "product created succussfully"})
       
    }
    catch(err){
        console.log(err)
        console.log("failed to add products")
        res.status(500).json({ error: err, message: "something went wrong (add products)"})
    }
}

const editProductPage = async (req, res) => {
    try{
        const { id } = req.params

        const category = await categorySchema.find().sort({_id: -1})
        const brand = await brandSchema.find()
        // const product = await productSchema.findOne({_id: id})

        const product = await productSchema.aggregate([
            {$match: {_id: new Types.ObjectId(id)}},
            {$lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category"
            }},
            {$unwind: "$category"},
            {$lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"}
        ])

        res.render('admin/editProduct', { product: product[0], category, brand })
    }
    catch(err){
        console.log(err)
        console.log("failed to get edit product page")
        res.status(500).json({success: false, message: "something went wrong (edit product page)"})
    }
}

const editProductPost = async (req, res) => {
    try{
        const { newName, newDiscount, newDiscription, newBrand, newCategory } = req.body
        const { id } = req.params

        const product = await productSchema.find({_id: id})

        const editName = newName || product.name
        const editDiscount = newDiscount || product.discount
        const editDiscription = newDiscription || product.discription
        const editBrand = newBrand || product.brand
        const editCategory = newCategory || product.category

        await productSchema.updateMany({_id: id}, {$set: {
            name: editName,
            discount: editDiscount,
            discription: editDiscription,
            brand: editBrand,
            category: editCategory
        }})

        res.redirect('/admin/product')


    }
    catch(err){
        console.log(err)
        console.log("failed to edit the product")
        res.status(500).json({success: false, message: "something went wrong (edit product post)"})
    }
}

const blockProduct = async (req, res) => {
    try{
        const { id } = req.body

        await productSchema.findOneAndUpdate({_id: id}, {$set: {isListed: false}})
        res.status(200).json({message: "product has been blocked"})

    }
    catch(err){
        console.log(err)
        console.log("failed to block the product")
        res.status(500).json({success: false, message: "something went wrong (block product)"})
    }
}

const unblockProduct = async (req, res) => {
    try{
        const { id } = req.body
        
        await productSchema.findOneAndUpdate({_id: id}, {$set: {isListed: true}})
        res.status(200).json({message: "product has been unblocked"})

    }
    catch(err){
        console.log(err)
        console.log("failed to unblock the product")
        res.status(500).json({success: false, message: "something went wrong (unblck product)"})
    }
}

const deleteProduct = async (req, res) => {
    try{
        const { id } = req.body

        const product = await productSchema.findOneAndDelete({_id: id})

        if(product){
            res.status(200).json({message: "successfully deleted the product"})
        }
        else{
            res.status(404).json({status: false, message: "product not found"})
        }
        
    }
    catch(err){
        console.log(err)
        console.log("failed to delete the product")
        res.status(500).json({success: false, message: "something went wrong (delete product)"})
    }
}

const pagination = async (req, res) => {
    try{
        const { page } = req.params
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/product')
        }
        const productCount = await productSchema.countDocuments()

        const products = await productSchema.aggregate([
            {$lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category"
            }},
            {$unwind: "$category"},
            {$lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"},
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
            {$sort: {_id: -1}},
            {$skip: limit*pageNo},
            {$limit: limit}
        ])

        if(pageNo * limit + limit >= productCount){
            res.render('admin/productManagement', { products, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('admin/productManagement', { products, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to go to the pagination page")
        res.status(500).json({success: false, message: "something went wrong (product pagination page)"})
    }
}

const searchProduct = async (req, res) => {
    try{
        const { name } = req.body

        if(!name){
            return res.redirect(req.get("Referer"))
        }

        const product = await productSchema.findOne({name})

        if(!product){
            let nullValue = null
            return res.redirect(`/admin/productSearchResult/${nullValue}`)
        }

        return res.redirect(`/admin/productSearchResult/${product.name}`)
    }
    catch(err){
        console.log(err)
        console.log("failed to search the product")
        res.status(500).json({message: "something went wrong (product search)"})
    }
}

const searchResult = async (req, res) => {
    try{
        const { name } = req.params

        if(name=="null"){
            return res.render('admin/productManagement', { products: false, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
        }

        const products = await productSchema.aggregate([
            {$match: {name}},
            {$lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category"
            }},
            {$unwind: "$category"},
            {$lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brand"
            }},
            {$unwind: "$brand"},
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
            
        ])

        res.render('admin/productManagement', { products, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
    }
    catch(err){
        console.log(err)
        console.log("failed to get the search result page")
        res.status(500).json({message: "something went wrong (product search result)"})
    }
}

module.exports = {
    addProductPage,
    addProductPost,
    productManagement,
    editProductPage,
    editProductPost,
    blockProduct,
    unblockProduct,
    deleteProduct,
    pagination,
    searchProduct,
    searchResult

}