const mongoose = require('mongoose')

const connected = async () => {

    try{
        await mongoose.connect('mongodb://localhost:27017/ecommerce', {})
        console.log("successfully connected to the database")
    }
    catch(err){
        console.log(err)
        console.log("failed to connect to the database")
    }

}

module.exports = connected