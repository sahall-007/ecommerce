
const express = require('express')
const costumerController = require('../../controller/admin/costumerController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()


router.route('/userManagement')
    .get(middleware.checkSession, costumerController.loadUserManagement)

router.route('/addUser')
    .get(middleware.checkSession, costumerController.addUserPage)
    .post(costumerController.addUserPost)

router.route('/blockUser')
    .patch(costumerController.blockUser)

router.route('/unBlockUser')
    .patch(costumerController.unBlockUser)
    
router.route('/deleteUser')
    .delete(costumerController.deleteUser)

router.route('/userManagement/next')
    .get(middleware.checkSession, costumerController.nextPage)

router.route('/userManagement/prev')
    .get(middleware.checkSession, costumerController.prevPage)

router.route('/searchUser')
    .post(costumerController.searchUser)

router.route('/searchResult/:username')
    .get(middleware.checkSession, costumerController.searchResult)

module.exports = router