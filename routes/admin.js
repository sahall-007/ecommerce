
const express = require('express')
const adminController = require('../controller/adminController.js')

const router = express.Router()


router.route('/login')
    .get(adminController.loadLogin)
    .post(adminController.loginVerify)

router.route('/dashboard')
    .get(adminController.loadDashboard)

router.route('/userManagement')
    .get(adminController.loadUserManagement)



module.exports = router