
const brandSchema = require('../../model/brandSchema.js')

const addBrandPage = async (req, res) => {
    try{
        res.status(200).render('admin/addBrand')
    }
    catch(err){
        console.log(err)
        console.log("failed to get add brand page")
        res.status(500).json({success: false, message: "something went wrong (add brand page)"})
    }
}

const addBrandPost = async (req, res) => {
    try{
        let { name, status } = req.body

        const brandExist = await brandSchema.findOne({name: new RegExp(`^${name}$`, "i")})

        if(brandExist){
            return res.status(403).json({success: false, message: "brand already exist"})
        }

        const isListed = (status == "active") ? true : false

        const brand = await new brandSchema({
            name,
            isListed
        })

        await brand.save()
        res.sendStatus(200)

    }
    catch(err){
        console.log(err)
        console.log("failed to add brand ")
        res.status(500).json({success: false, message: "something went wrong (post brand)"})
    }
}

const brandManagement = async (req, res) => {
    try{
        const brandCount = await brandSchema.countDocuments()
        const limit = 5
        const brands = await brandSchema.find().sort({_id: -1}).limit(limit)

        if (limit >= brandCount) {
            return res.status(200).render('admin/brandManagement', { brands, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('admin/brandManagement', { brands, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })
    }
    catch(err){
        console.log(err)
        console.log("failed to get brand management page")
        res.status(500).json({success: false, message: "something went wrong (brand management)"})
    }
}

const brandEditPage = async (req, res) => {
    try{
        const { name } = req.params

        const brand = await brandSchema.findOne({name})

        res.status(200).render('admin/editBrand', { brand })
    }
    catch(err){
        console.log(err)
        console.log("failed to get edit brand page")
        res.status(200).json({success: false, message: "something went wrong (edit brand page)"})
    }
}

const brandEditPost = async (req, res) => {
    try{
        const { newName, newStatus, newDiscount } = req.body
        const { name } = req.params
        
        if(name.toLowerCase() != newName.toLowerCase()){
            const brandExist = await brandSchema.findOne({name: new RegExp(`^${newName}$`, "i")})
                
            if(brandExist){
                return res.status(403).json({success: false, message: "brand already exist"})
            }
        }

        const brand = await brandSchema.findOne({name})
        
        let editingName = newName || brand.name
        let editingDiscount = newDiscount || brand.discount
        let isListed = (newStatus=="active") ? true : false
    
        await brandSchema.findOneAndUpdate({name}, {$set: { name: editingName, discount: editingDiscount, isListed}})
    
        res.redirect('/admin/brand')
    }
    catch(err){
        console.log(err)
        console.log("failed to post edit brand")
        res.status(500).json({success: false, message: "something went wrong (edit brand post)"})
    }
}

const brandBlock = async (req, res) => {
    try{
        const { id } = req.body
        
        await brandSchema.findOneAndUpdate({_id: id}, {$set: {isListed: false}})

        res.status(200).json({message: "brand has been blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to block the brand")
        res.status(500).json({success: false, message: "something went wrong (block brand)"})
    }
}

const brandUnblock = async (req, res) => {
    try{
        const { id } = req.body
        
        await brandSchema.findOneAndUpdate({_id: id}, {$set: {isListed: true}})

        res.status(200).json({message: "brand has been unblocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to unblock the brand")
        res.status(500).json({success: false, message: "something went wrong (unblcok brand)"})
    }
}

const deleteBrand = async (req, res) => {
    try{
        const { id } = req.body
        
        const brand = await brandSchema.findOneAndDelete({_id: id})

        if(brand){
            return res.status(200).json({message: "successfully deleted the brand"})
        }
        else{
            return res.status(404).json({status: false, message: "brand not found"})
        }

    }
    catch(err){
        console.log(err)
        console.log("failed to delete the brand")
        res.status(500).json({success: false, message: "something went wrong (delete brand)"})
    }
}

const pagination = async (req, res) => {
    try{
        const { page } = req.params
                
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/brand')
        }
        const brandCount = await brandSchema.countDocuments()
        const brands = await brandSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        if(pageNo * limit + limit >= brandCount){
            res.render('admin/brandManagement', { brands, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('admin/brandManagement', { brands, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }
    }
    catch(err){
        console.log(err)
        console.log("failed to get the pagination page")
        res.status(500).json({success: false, message: "something went wrong (brand pagination page)"})
    }
}

const searchBrand = async (req, res) => {
    try{
        const { name } = req.body
        
        if(!name){
            return res.redirect(req.get("Referer"))
        }

        const brand = await brandSchema.findOne({name})

        if(!brand){
            let nullValue = null
            return res.redirect(`/admin/brandSearchResult/${nullValue}`)
        }

        return res.redirect(`/admin/brandSearchResult/${brand.name}`)
    }
    catch(err){
        console.log(err)
        console.log("failed to search for the brand")
        res.status(500).json({success: false, message: "something went wrong (search brand)"})
    }
}

const searchResult = async (req, res) => {
    console.log("search result is hit...")
    try{
        const { name } = req.params

        if(name=="null"){
            return res.render('admin/brandManagement', { brands: false, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
        }

        const brand = await brandSchema.findOne({name})

        let arr = [brand]

        res.render('admin/brandManagement', { brands: arr, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
    }
    catch(err){
        console.log(err)
        console.log("failed to get the brand search result page")
        res.status(500).json({success: false, message: "something went wrong (brand search result)"})
    }
}


module.exports = {
    addBrandPage,
    addBrandPost,
    brandManagement,
    brandEditPage,
    brandEditPost,
    brandBlock,
    brandUnblock,
    deleteBrand,
    pagination,
    searchBrand,
    searchResult
}