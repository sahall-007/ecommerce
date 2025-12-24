
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')
const { castObject } = require('../../model/userSchema.js')
const variantSchema = require('../../model/variantSchema.js')

const variantManagement = async (req, res) => {
    try{
        const { id } = req.params

        const variants = await variantSchema.find({productId: id})

        if(variants.length<=0){
            return res.status(404).render('pageNotFound')
        }

        res.status(200).render('admin/variantManagement', {variants , nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })

    }
    catch(err){
        console.log(err)
        console.log("failed to get variant management page")
        res.status(500).json({success: false, message: "something went wrong (variant management page)"})
    }
}

const addvariantPage = async (req, res) => {
    try {
        const { id } = req.params

        res.status(200).render('admin/addVariant', { editId: id})
    } 
    catch (err) {
        console.log(err)    
        console.log("failed to get add variant page")
        res.status(500).json({success: false, message: "something went wrong (add variant page)"})
    }
}

const addvariantPost = async (req, res) => {
    try{

        const { id } = req.params

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

        let { ram, storage, color, quantity, price } = req.body

        const product = await productSchema.findOne({_id: id})

        await variantSchema.create({
            ram,
            storage,
            color,
            quantity,
            price,
            image: images["image-1"],
            productId: product._id
        })

        res.status(200).json({message: "kalapilaaa"})
    }
    catch(err){

    }
}

const editVariantPage = async (req, res) => {
    try{
        const { id } = req.params

        const variant = await variantSchema.findOne({_id: id})

        res.status(200).render('admin/editVariant', { variant, images: variant.image, productId: variant.productId})
    }
    catch(err){
        console.log(err)
        console.log("failed to get edit variant page")
        res.status(500).json({succsess: false, message: "something went wrong (edite variant page)"})
    }
}

const deleteImg = async (req, res) => {
    try {
        const { variantId, imageIndex } = req.body

        const img = await variantSchema.findOne({_id: variantId}, {image: 1})
        
        const deleteVariantImg = await variantSchema.updateOne({_id: variantId}, {$pull: {image: img.image[imageIndex]}})
        const afterDelete = await variantSchema.findOne({_id: variantId})
        
        if(deleteVariantImg.modifiedCount == 1){
            res.status(200).json({success: true, message: "successfully deleted the image"})
        }
        else{
            res.status(404).json({success: false, message: "cannot find the image"})
        }

    } 
    catch (err) {
        console.log(err)
        console.log("failed to delete the image")
        res.status(500).json({succsess: false, message: "something went wrong (delete image)"})
    }
}

const editVariantPost = async (req, res) => {
    try{
        const { id } = req.params

        // ---------------- to update the variant details -------------------

        const variant = await variantSchema.findOne({_id: id}, {image: 0})

        if(!variant){
            return res.status(404).json({success: false, message: "variant not found"})
        }

        const { ram, storage, color, quantity, price } = req.body

        let editRam = ram || variant.ram
        let editStorage = storage || variant.storage
        let editColor = color || variant.color
        let editQuantity = quantity || variant.quantity
        let editPrice = price || variant.price

        await variantSchema.updateOne({_id: id}, {
            ram: editRam,
            storage: editStorage,
            color: editColor,
            quantity: editQuantity,
            price: editPrice
        })

        
        // ----------------- to update the image ---------------------

        if(req.files.length >= 1){
            let indexOfDash = req.files[0].fieldname.indexOf("-")

            for(let i=0; i<req.files.length; i++){
            
                let path = req.files[i].path.replace(/\\/g, '/')
                
                if(req.files[i].originalname == "extraNewImage.jpeg"){
                    const addNewExtraImg = await variantSchema.updateOne({_id: id}, {$push: {image: path}})
                }
                else{
                    let index = Number(req.files[i].fieldname.slice(indexOfDash+1))

                    const img = await variantSchema.findOne({_id: id}, {image: 1})
                    await variantSchema.updateOne({_id: id}, {$pull: {image: img.image[index]}})
                    await variantSchema.updateOne({_id: id}, {$push: {image: {$each: [path], $position: index}}})
                }
            }

            const productIdOfVariant = await variantSchema.findOne({_id: id}, {productId: 1})

            if(productIdOfVariant){
                res.status(200).redirect(`/admin/variant/${productIdOfVariant.productId}`)
            }
            else{
                res.status(404).json({success: false, message: "could not find the productid"})
            }
        }

         await variantSchema.findOne({_id: id})

        res.status(200).json({success: true, message: "successfully edited the variant"})

    }
    catch(err){
        console.log(err)
        console.log("failed to edit the variants")
        res.status(500).json({success: false, message: "something went wrong (edit variant post)"})
    }
}

const blockVariant = async (req, res) => {
    try{
        const { id } = req.body

        await variantSchema.findOneAndUpdate({_id: id}, {$set: {isListed: false}})

        res.status(200).json({message: "variant has been blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to block the variant")
        res.stauts(500).json({succcess: false, message: "failed to blck the variant"})
    }
}

const unBlockVariant = async (req, res) => {
    try{
      const { id } = req.body

    await variantSchema.findOneAndUpdate({_id: id}, {$set: {isListed: true}})

    res.status(200).json({message: "variant has been un blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to unblock the variant")
        res.status(500).json({success: false, message: "something went wrong (unblock the variant )"})
    }
}

module.exports = {
    variantManagement,
    addvariantPage,
    addvariantPost,
    editVariantPage,
    deleteImg,
    editVariantPost,
    blockVariant,
    unBlockVariant
}