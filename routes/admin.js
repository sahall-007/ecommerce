
const express = require('express')
const adminController = require('../controller/admin/adminController.js')
const costumerController = require('../controller/admin/costumerController.js')

const router = express.Router()


router.route('/login')
    .get(adminController.loadLogin)
    .post(adminController.loginVerify)

router.route('/dashboard')
    .get(adminController.loadDashboard)

router.route('/userManagement')
    .get(costumerController.loadUserManagement)

router.route('/addUser')
    .get(costumerController.addUserPage)
    .post(costumerController.addUserPost)

router.route('/blockUser')
    .patch(costumerController.blockUser)

router.route('/unBlockUser')
    .patch(costumerController.unBlockUser)
    
router.route('/deleteUser')
    .delete(costumerController.deleteUser)

router.route('/userManagement/next')
    .get(costumerController.nextPage)

router.route('/userManagement/prev')
    .get(costumerController.prevPage)

router.route('/searchUser')
    .post(costumerController.searchUser)

router.route('/searchResult/:username')
    .get(costumerController.searchResult)


module.exports = router