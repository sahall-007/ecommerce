

const express = require('express')
const userController = require('../controller/user/userController.js')

const router = express.Router()

router.get('/', (req, res) => {
    res.json({ message: "App has started to work!!!" });
})

router.route('/register')
    .get(userController.loadRegister)
    .post(userController.registerUser)

router.route('/login')
    .get(userController.loadLogin)
    




module.exports = router