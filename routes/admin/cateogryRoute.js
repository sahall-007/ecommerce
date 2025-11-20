const express = require('express')
const categoryController = require('../../controller/admin/categoryController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()


router.route('/category')
    .get(middleware.checkSession, categoryController.loadCategoryManagement)
    
router.route('/addCategory')
    .get(middleware.checkSession, categoryController.addCategoryPage)
    .post(categoryController.addCategoryPost)

router.route('/blockCategory')
    .patch(categoryController.blockCategory)

router.route('/unBlockCategory')
    .patch(categoryController.unBlockCategory)

// router.route('/deleteCategory')    
//     .delete(categoryController.deleteCategory)

router.route('/category/next')
    .get(middleware.checkSession, categoryController.nextPage)

router.route('/category/prev')
    .get(middleware.checkSession, categoryController.prevPage)

router.route('/searchCategory')
    .post(categoryController.searchCategory)

router.route('/catSearchResult/:name')
    .get(middleware.checkSession, categoryController.searchResult)

router.route('/editCategory/:name')
    .get(middleware.checkSession, categoryController.editCategoryPage)
    .post(categoryController.editCategoryPost)


module.exports = router