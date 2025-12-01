const express = require('express')
const categoryController = require('../../controller/admin/categoryController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()


router.route('/category')
    .get(middleware.checkSession, categoryController.loadCategoryManagement)
    
router.route('/addCategory')
    .get(middleware.checkSession, categoryController.addCategoryPage)
    .post(middleware.checkSession, categoryController.addCategoryPost)

router.route('/blockCategory')
    .patch(middleware.checkSession, categoryController.blockCategory)

router.route('/unBlockCategory')
    .patch(middleware.checkSession, categoryController.unBlockCategory)

// router.route('/deleteCategory')    
//     .delete(categoryController.deleteCategory)

router.route('/category/:page')
    .get(middleware.checkSession, categoryController.pagination)

// router.route('/category/prev')
//     .get(middleware.checkSession, categoryController.prevPage)

router.route('/searchCategory')
    .post(middleware.checkSession, categoryController.searchCategory)

router.route('/catSearchResult/:name')
    .get(middleware.checkSession, categoryController.searchResult)

router.route('/editCategory/:name')
    .get(middleware.checkSession, categoryController.editCategoryPage)
    .post(middleware.checkSession, categoryController.editCategoryPost)


module.exports = router