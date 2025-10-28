
const express = require('express')
const adminController = require('../controller/admin/adminController.js')
const costumerController = require('../controller/admin/costumerController.js')
const categoryController = require('../controller/admin/categoryController.js')

const router = express.Router()


router.route('/login')
    .get(adminController.loadLogin)
    .post(adminController.loginVerify)

router.route('/dashboard')
    .get(adminController.loadDashboard)


// costumer controllers--------------------------

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

// category controllers--------------------------

router.route('/category')
    .get(categoryController.loadCategoryManagement)
    
router.route('/addCategory')
    .get(categoryController.addCategoryPage)
    .post(categoryController.addCategoryPost)

router.route('/blockCategory')
    .patch(categoryController.blockCategory)

router.route('/unBlockCategory')
    .patch(categoryController.unBlockCategory)

router.route('/deleteCategory')    
    .delete(categoryController.deleteCategory)

router.route('/category/next')
    .get(categoryController.nextPage)

router.route('/category/prev')
    .get(categoryController.prevPage)

router.route('/searchCategory')
    .post(categoryController.searchCategory)

router.route('/catSearchResult/:name')
    .get(categoryController.searchResult)

router.route('/editCategory/:name')
    .get(categoryController.editCategoryPage)
    .post(categoryController.editCategoryPost)

module.exports = router