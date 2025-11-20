
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')
const { castObject } = require('../../model/userSchema.js')
const variantSchema = require('../../model/variantSchema.js')

const productManagement = async (req, res) => { 
    try{
        const productCount = await productSchema.countDocuments()
        let limit = 5
        // const products = await productSchema.find().sort({_id: -1}).limit(limit)

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
            return res.render('productManagement', { products, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('productManagement', { products, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })
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
        // console.log(category)

        res.status(200).render('addProduct', { category, brand })
    }
    catch(err){
        console.log(err)
        console.log("failed to get add product page")
        res.status(500).json({error: err, message: "somthing went wrong (get add product page)"})
    }
}

const addProductPost = async (req, res) => {
    try{       
        // console.log(req.body)
        // console.log(req.files)

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

console.log(images)

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

        // const productExist = await productSchema.find({name})

        // console.log(productExist)

        // if(productExist){
        //     console.log("product exist check")
        //     return res.status(403).json({success: false, message: "product already exist"})
        // }

        const categoryDetail = await categorySchema.findOne({name: category}, {name: 1, _id: 1})
        const brandDetail = await brandSchema.findOne({name: brand}, {name: 1, _id: 1})

        console.log(categoryDetail)

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

        // console.log("new product", product)

        let indexOfDash = keys[0].indexOf("-")

        for(let i=0; i<totalVariants; i++){
            console.log("inside of creating new variant")

            let imageFieldName

            for(let j=0; j<keys.length; j++){
                if(Number(keys[j].slice(indexOfDash+1)) == i+1){
                    console.log("before imagefield", imageFieldName, i)
                    imageFieldName = keys[j]
                    console.log("after imagefield", imageFieldName, i)
                }
            }
            console.log("imagefield", imageFieldName)
            let variantImage = images[imageFieldName]

            console.log("this is variant image", variantImage)

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
        const product = await productSchema.findOne({_id: id})

        console.log(product)
        
        res.render('editProduct', { product, category, brand })
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

        const newProduct = await productSchema.updateMany({_id: id}, {$set: {
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

const nextPage = async (req, res) => {
    try{
        const { page } = req.query
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/product')
        }
        const productCount = await productSchema.countDocuments()
        // const products = await productSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

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

        console.log(pageNo * limit + limit)
        console.log(productCount)

        if(pageNo * limit + limit >= productCount){
            res.render('productManagement', { products, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('productManagement', { products, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }
    }
    catch(err){
        console.log(err)
        console.log("failed to go to the next page")
        res.status(500).json({success: false, message: "something went wrong (product next page)"})
    }
}

const prevPage = async (req, res) => {
    try{
        const { page } = req.query

        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.status(200).redirect('/admin/product')
        }

        // const products = await productSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

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

        res.status(200).render('productManagement', { products, prevPage: pageNo - 1, nextPage: pageNo + 1, prevDisable: null, nextDisable: null})

    }
    catch(err){
        console.log(err)
        console.log("failed to get previous page")
        res.status(500).json({success: false, message: "something went wrong, (products prev page)"})
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
    console.log("search result is hit...")
    try{
        const { name } = req.params

        if(name=="null"){
            return res.render('productManagement', { products: false, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
        }

        // const product = await productSchema.findOne({name})
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

        // let arr = [product]

        res.render('productManagement', { products, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
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
    nextPage,
    prevPage,
    searchProduct,
    searchResult

}