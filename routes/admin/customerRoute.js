
const express = require('express')
const costumerController = require('../../controller/admin/costumerController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()


router.route('/userManagement')
    .get(middleware.checkSession, costumerController.loadUserManagement)

router.route('/addUser')
    .get(middleware.checkSession, costumerController.addUserPage)
    .post(middleware.checkSession, costumerController.addUserPost)

router.route('/blockUser')
    .patch(middleware.checkSession, costumerController.blockUser)

router.route('/unBlockUser')
    .patch(middleware.checkSession, costumerController.unBlockUser)
    
router.route('/deleteUser')
    .delete(middleware.checkSession, costumerController.deleteUser)

router.route('/userManagement/:page')
    .get(middleware.checkSession, costumerController.pagination)

// router.route('/userManagement/prev')
//     .get(middleware.checkSession, costumerController.prevPage)

router.route('/searchUser')
    .post(middleware.checkSession, costumerController.searchUser)

router.route('/searchResult/:username')
    .get(middleware.checkSession, costumerController.searchResult)

module.exports = router