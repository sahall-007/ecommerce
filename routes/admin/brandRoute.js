
const express = require('express')
const brandController = require('../../controller/admin/brandController.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()


router.route('/addBrand')
    .get(middleware.checkSession, brandController.addBrandPage)
    .post(middleware.checkSession, brandController.addBrandPost)

router.route('/brand')
    .get(middleware.checkSession, brandController.brandManagement)


router.route('/editBrand/:name')
    .get(middleware.checkSession, brandController.brandEditPage)
    .post(middleware.checkSession, brandController.brandEditPost)

router.route('/blockBrand')
    .patch(middleware.checkSession, brandController.brandBlock)

router.route('/unblockBrand')
    .patch(middleware.checkSession, brandController.brandUnblock)

// router.route('/deleteBrand')
//     .delete(brandController.deleteBrand)

router.route('/brand/next')
    .get(middleware.checkSession, brandController.nextPage)

router.route('/brand/prev')
    .get(middleware.checkSession, brandController.prevPage)

router.route('/searchBrand')
    .post(middleware.checkSession, brandController.searchBrand)

router.route('/brandSearchResult/:name')
    .get(middleware.checkSession, brandController.searchResult)


module.exports = router