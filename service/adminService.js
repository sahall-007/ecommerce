
const adminSchema = require('../model/adminSchema.js')

const adminVerify = async (adminData) => {
    try{
        const { name, email, password} = adminData

        const admin = await adminSchema.findOne({ name })

        if(!admin){
            throw new Error("wrong credentials")
        }
    }
    catch(err) {
        console.log(err)
        console.log("failed to login (service)")
    }
}

module.exports = {
    adminVerify
}