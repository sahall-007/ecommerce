
const categorySchema = require('../../model/categorySchema.js')


const loadCategoryManagement = async (req, res) => {
    try{
        const categoryCount = await categorySchema.countDocuments()
        const limit = 5
        const categories = await categorySchema.find().sort({_id: -1}).limit(limit)

        if (limit >= categoryCount) {
            return res.status(200).render('categoryManagement', { categories, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }

        res.status(200).render('categoryManagement', { categories, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })
    }
    catch(err){
        console.log(err)
        console.log("failed to load category management")
        res.status(500).json({message: "somthing went wrong, (load category management)"})
    }
}

const addCategoryPage = async (req, res) => {
    try{
        res.status(200).render('addCategory')
    }
    catch(err){
        console.log(err)
        console.log("failed to get add category page")
        res.status(500).json({message: "something went wrong (add category page)"})
    }
}

const addCategoryPost = async(req, res) => {
    try{
        const { name, status } = req.body

        const existCategory = await categorySchema.findOne({name})

        if(existCategory){
            // throw new Error()
            return res.status(403).json({success: false, message: "category already exist"})
        }

        const isListed = (status=="active") ? true : false

        const category = await new categorySchema({
            name,
            isListed,
        })

        await category.save()

        res.redirect('/admin/category')

    }
    catch(err){
        console.log(err)
        console.log("failed to add new category")
        res.status(500).json({message: "somthing went wrong (add new category post)"})
    }
}

const blockCategory = async (req, res) => {
    try{
        const { id } = req.body

        await categorySchema.findOneAndUpdate({_id: id}, {$set: {isListed: false}})

        res.status(200).json({message: "category has been blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to block the user")
        res.status(500).json({message: "something went wrong (block category)"})
    }
}

const unBlockCategory = async (req, res) => {
    console.log("category un block handler hit  ........")
    try{
        const { id } = req.body

        await categorySchema.findOneAndUpdate({_id: id}, {$set: {isListed: true}})

        res.status(200).json({message: "category has been unblocked"})

    }
    catch(err){
        console.log(err)
        console.log("failed to unblock user")
        res.status(500).json({message: "something went wrong (unblock category)"})
    }
}

const deleteCategory = async (req, res) => {
    try{
        const { id } = req.body

        const category = await categorySchema.findOneAndDelete({_id: id})

        if(category){
            return res.status(200).json({message: "successfully deleted the category"})
        }
        else{
            return res.status(404).json({status: false, message: "category not found"})
        }

        res.status(200).json({message: "successfully deleted the category"})
    }
    catch(err){
        console.log(err)
        console.log("failed to delete user")
        res.status(500).json({message: "something went wrong, (delete category)"})
    }
}

const nextPage = async (req, res) => {
   
    console.log("next handler hit")
    try{
        const { page } = req.query
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/category')
        }
        const categoryCount = await categorySchema.countDocuments()
        const categories = await categorySchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        console.log(categoryCount)

        if(pageNo * limit + limit >= categoryCount){
            res.render('categoryManagement', { categories, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('categoryManagement', { categories, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }

    }
    catch(err){
        console.log(err)
        console.log("failed to retrieve next page")
        res.status(500).json({message: "something went wrong, (category next page)"})
    }
}

const prevPage = async (req, res) => {
console.log("prev handler hit.........")
    try{
        const { page } = req.query

        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/category')
        }

        const categories = await categorySchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        res.render('categoryManagement', { categories, prevPage: pageNo - 1, nextPage: pageNo + 1, prevDisable: null, nextDisable: null})

    }
    catch(err){
        console.log(err)
        console.log("failed to get previous page")
        res.status(500).json({message: "something went wrong, (category prev page)"})
    }
}

const searchCategory = async (req, res) => {
    try{
        const { name } = req.body

        if(!name){
            return res.redirect(req.get("Referer"))
        }

        const category = await categorySchema.findOne({name})

        if(!category){
            console.log("here is the error")
            let nullValue = null
            return res.redirect(`/admin/catSearchResult/${nullValue}`)
        }

        return res.redirect(`/admin/catSearchResult/${category.name}`)
    }
    catch(err){
        console.log(err)
        console.log("failed to search the user")
        res.status(500).json({message: "something went wrong (category search)"})
    }
}

const searchResult = async (req, res) => {
    console.log("search result is hit...")
    try{
        const { name } = req.params

        if(name=="null"){
            return res.render('categoryManagement', { categories: false, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
        }

        const category = await categorySchema.findOne({name})

        let arr = [category]

        res.render('categoryManagement', { categories: arr, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
    }
    catch(err){
        console.log(err)
        console.log("failed to get the search result page")
        res.status(500).json({message: "something went wrong (category search result)"})
    }
}

const editCategoryPage = async (req, res) => {
    try{

        const { name } = req.params

        res.status(200).render('editCategory', { editName: name })
    }
    catch(err){
        console.log(err)
        console.log("failed to get category edit page")
        res.status(500).json({message: "something went wrong (category edit page)"})
    }
}

const editCategoryPost = async (req, res) => {
    try{
    const { newName, newStatus } = req.body
    const { name } = req.params

    const category = await categorySchema.findOne({name})

    // if(!newName){
    //     newName = category.name
    // }

    let editingName = newName || category.name

    console.log(newName, newStatus)

    let isListed = (newStatus=="active") ? true : false


    const edited = await categorySchema.findOneAndUpdate({name}, {$set: { name: editingName, isListed}})

    res.redirect('/admin/category')

}
catch(err){
    console.log(err)
    console.log("failed to edit category")
    res.status(500).json({message: "somthing went wrong (edit category post)"})
}
}

module.exports = {
    loadCategoryManagement,
    addCategoryPage,
    addCategoryPost,
    blockCategory,
    unBlockCategory,
    deleteCategory,
    nextPage,
    prevPage,
    searchCategory,
    searchResult,
    editCategoryPage,
    editCategoryPost
}