
const express = require('express')
const adminController = require('../controller/admin/adminController.js')
const costumerController = require('../controller/admin/costumerController.js')
const categoryController = require('../controller/admin/categoryController.js')
const productController = require('../controller/admin/productController.js')
const middleware = require('../middlewares/adminAuth.js')
const uploads = require('../middlewares/multer.js')

const productSchema = require('../model/productSchema.js')

const router = express.Router()


router.route('/login')
    .get(adminController.loadLogin)
    .post(adminController.loginVerify)

router.route('/dashboard')
    .get(middleware.checkSession, adminController.loadDashboard)

router.route('/logout')
    .get(adminController.logout)

// costumer controllers--------------------------

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

// category controllers--------------------------

router.route('/category')
    .get(middleware.checkSession, categoryController.loadCategoryManagement)
    
router.route('/addCategory')
    .get(middleware.checkSession, categoryController.addCategoryPage)
    .post(categoryController.addCategoryPost)

router.route('/blockCategory')
    .patch(categoryController.blockCategory)

router.route('/unBlockCategory')
    .patch(categoryController.unBlockCategory)

router.route('/deleteCategory')    
    .delete(categoryController.deleteCategory)

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


// products

router.route('/product')
    .get(middleware.checkSession, productController.productManagement)

router.route('/addProduct')
    .get(middleware.checkSession, productController.addProductPage)
    .post(uploads.upload.any(), productController.addProductPost)

router.route('/editProduct/:id')
    .get(middleware.checkSession, productController.editProductPage)
    .post(productController.editProductPost)

router.route('/blockProduct')
    .patch(productController.blockProduct)

router.route('/unblockProduct')
    .patch(productController.unblockProduct)

router.route('/deleteProduct')
    .delete(productController.deleteProduct)

router.route('/product/next')
    .get(middleware.checkSession, productController.nextPage)

router.route('/product/prev')
    .get(middleware.checkSession, productController.prevPage)

router.route('/searchProduct')
    .post(productController.searchProduct)

router.route('/productSearchResult/:name')
    .get(middleware.checkSession, productController.searchResult)


module.exports = router