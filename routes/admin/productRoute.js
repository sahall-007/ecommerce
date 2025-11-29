
const express = require('express')

const productController = require('../../controller/admin/productController.js')

const middleware = require('../../middlewares/adminAuth.js')
const uploads = require('../../middlewares/multer.js')


const router = express.Router()

router.route('/product')
    .get(middleware.checkSession, productController.productManagement)

router.route('/addProduct')
    .get(middleware.checkSession, productController.addProductPage)
    .post(uploads.upload.any(), productController.addProductPost)

router.route('/editProduct/:id')
    .get(middleware.checkSession, productController.editProductPage)
    .post(middleware.checkSession, productController.editProductPost)

router.route('/blockProduct')
    .patch(middleware.checkSession, productController.blockProduct)

router.route('/unblockProduct')
    .patch(middleware.checkSession, productController.unblockProduct)

router.route('/deleteProduct')
    .delete(middleware.checkSession, productController.deleteProduct)

router.route('/product/next')
    .get(middleware.checkSession, productController.nextPage)

router.route('/product/prev')
    .get(middleware.checkSession, productController.prevPage)

router.route('/searchProduct')
    .post(middleware.checkSession, productController.searchProduct)

router.route('/productSearchResult/:name')
    .get(middleware.checkSession, productController.searchResult)



module.exports = router