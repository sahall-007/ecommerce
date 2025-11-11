
const categorySchema = require('../../model/categorySchema.js')
const brandSchema = require('../../model/brandSchema.js')
const productSchema = require('../../model/productSchema.js')
const { castObject } = require('../../model/userSchema.js')
const variantSchema = require('../../model/variantSchema.js')

const variantManagement = async (req, res) => {
    try{
        const { id } = req.params

        const variants = await variantSchema.find({productId: id})

        res.status(200).render('variantManagement', {variants , nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })

    }
    catch(err){
        console.log(err)
        console.log("failed to get variant management page")
        res.status(500).json({success: false, message: "something went wrong (variant management page)"})
    }
}

module.exports = {
    variantManagement
}