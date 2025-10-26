
const userSchema = require('../model/userSchema.js')
const bcrypt = require('bcrypt')

const salt = 10

const registerUserService = async (userData) => {
    try{
        const { username, email, password } = userData

        const user = await userSchema.findOne({ username })

        if(user){
            throw new Error("user already exist")
        }

        const hashedPassword = await bcrypt.hash(userData.password, salt)

        const newuser = await new userSchema({
            username,
            email,
            password: hashedPassword
        })

        await newuser.save()
    }
    catch(err){
        console.log(err)
        console.log("failed to register the user (service)")
    }
}

module.exports = {
    registerUserService
}