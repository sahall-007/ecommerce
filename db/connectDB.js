const mongoose = require('mongoose')

const connected = async () => {

    try{
        await mongoose.connect('mongodb+srv://muhammedsahal275:bZnvxwjSCPsdzXL3@ecommerce.8pj5v30.mongodb.net/ecommerce?appName=ecommerce', {})
        console.log("successfully connected to the database")
    }
    catch(err){
        console.log(err)
        console.log("failed to connect to the database")
    }

}

module.exports = connected