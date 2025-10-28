
// const adminSchema = require('../../model/adminSchema.js')
const userSchema = require('../../model/userSchema.js')
const bcrypt = require('bcrypt')

const salt = 10


const loadUserManagement = async (req, res) => {

    try{
        const userCount = await userSchema.countDocuments()
        const limit = 5
        const users = await userSchema.find().sort({_id: -1}).limit(5)

        if (limit >= userCount) {
            return res.render('userManagement', { users: users, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: "disabled" })
        }
        
        res.status(200).render('userManagement', { users: users, nextPage: 1, prevPage: 0, prevDisable: "disabled", nextDisable: null })
    }
    catch(err){
        console.log(err)
        console.log("failed to load user management page")
        res.status(500).json({message: "somthing went wrong (user management page)"})
    }
}

const addUserPage = async (req, res) => {
    try{
        res.render('addUser')
    }
    catch(err){
        console.log(err)
        console.log("failed to retrieve add user page")
    }
}

const addUserPost = async (req, res) => {
    try{
        const { username, email, status, password } = req.body

        const isListed = (status==="active") ? true : false

        const hashedPassword = await bcrypt.hash(password, salt)

        const user = await new userSchema({
            username,
            email,
            password: hashedPassword,
            isListed
        })

        await user.save()

        console.log(isListed, status)


        res.redirect('/admin/userManagement')

    }
    catch(err){
        console.log(err)
        console.log("failed to edit the user !")
    }
}

const blockUser = async (req, res) => {
    console.log("handler hit ..............")
    try{
        const { id } = req.body

        await userSchema.findOneAndUpdate({_id: id}, {$set: {isListed: false}})

        res.status(200).json({message: "user has been blocked"})
    }
    catch(err){
        console.log(err)
        console.log("failed to block the user")
        res.status(500).json({message: "something went wrong (block user)"})
    }
}

const unBlockUser = async (req, res) => {
    console.log("un block handler hit ........")
    try{
        const { id } = req.body

        await userSchema.findOneAndUpdate({_id: id}, {$set: {isListed: true}})

        res.status(200).json({message: "user has been unblocked"})

    }
    catch(err){
        console.log(err)
        console.log("failed to unblock user")
        res.status(500).json({message: "something went wrong (unblock user)"})
    }
}

const deleteUser = async (req, res) => {
    try{
        const { id } = req.body

        await userSchema.findOneAndDelete({_id: id})

        res.status(200).json({message: "successfully deleted the user"})
    }
    catch(err){
        console.log(err)
        console.log("failed to delete user")
        res.status(500).json({message: "something went wrong, (delete user)"})
    }
}

const nextPage = async (req, res) => {
    
    console.log("next handler hit")
    try{
        const { page } = req.query
        
        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/userManagement')
        }
        const userCount = await userSchema.countDocuments()
        const users = await userSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        console.log(userCount)

        if(pageNo * limit + limit >= userCount){
            res.render('userManagement', { users: users, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: "disabled"})            
        }
        else{
            res.render('userManagement', { users: users, nextPage: pageNo + 1, prevPage: pageNo - 1, prevDisable: null, nextDisable: null})            
        }

    }
    catch(err){
        console.log(err)
        console.log("failed to retrieve next page")
        res.status(500).json({message: "something went wrong, (user next page)"})
    }
}

const prevPage = async (req, res) => {

    console.log("prev handler hit.........")
    try{
        const { page } = req.query

        const pageNo = Number(page)
        const limit = 5

        if(pageNo==0){
            return res.redirect('/admin/userManagement')
        }

        const users = await userSchema.find().sort({_id: -1}).skip(limit * pageNo).limit(limit)

        res.render('userManagement', { users, prevPage: pageNo - 1, nextPage: pageNo + 1, prevDisable: null, nextDisable: null})

    }
    catch(err){
        console.log(err)
        console.log("failed to get previous page")
        res.status(500).json({message: "something went wrong, (user prev page)"})
    }
}

const searchUser = async (req, res) => {
    console.log("search handler is hit")
    try{
        const { username } = req.body

        if(!username){
            return res.redirect(req.get("Referer"))
        }

        const user = await userSchema.findOne({username})

        if(!user){
            console.log("here is the error")
            let nullValue = null
           return res.redirect(`/admin/searchResult/${nullValue}`)
        }

        return res.redirect(`/admin/searchResult/${user.username}`)
    }
    catch(err){
        console.log(err)
        console.log("failed to search the user")
        res.status(500).json({message: "something went wrong (search user)"})
    }
}

const searchResult = async (req, res) => {
    console.log("search result is hit...")
    try{
        const { username } = req.params

        if(username=="null"){
            return res.render('userManagement', { users: false, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
        }

        const user = await userSchema.findOne({username})

        let arr = [user]

        res.render('userManagement', { users: arr, prevPage: null, nextPage: null, prevDisable: "disabled", nextDisable: "disabled"})
    }
    catch(err){
        console.log(err)
        console.log("failed to get the search result page")
        res.status(500).json({message: "something went wrong"})
    }
}

module.exports = {
    loadUserManagement,
    addUserPage,
    addUserPost,
    blockUser,
    unBlockUser,
    deleteUser,
    nextPage,
    prevPage,
    searchUser,
    searchResult
}