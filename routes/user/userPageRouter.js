
const express = require('express')
const userController = require('../../controller/user/userController.js');
const allProducctController = require('../../controller/user/allProductController.js')
const middleware = require('../../middlewares/userAuth.js')
const searchController = require('../../controller/user/searchController.js');

const router = express.Router()

router.route('/')
    .get(middleware.checkSession, userController.getHomePage)

router.route('/logout')
    .get(userController.logout)

router.route('/productDetail/:id')
    .get(middleware.checkSession, userController.productDetail)

router.route('/allProducts')
    .get(middleware.checkSession, allProducctController.allProducts)

router.route('/filter')
    .get(middleware.checkSession, allProducctController.filterPage)
    .post(allProducctController.filter)

router.route('/allProducts/next')
    .get(middleware.checkSession, allProducctController.nextPage)

router.route('/allProducts/prev')
    .get(middleware.checkSession, allProducctController.prevPage)

// search result
router.route('/search')
    .get(middleware.checkSession, searchController.searchResult)
    .post(allProducctController.search)

router.route('/searchFilter')
    .post(searchController.searchFilter)

// new arrivals
router.route('/newArrivals')
    .get(middleware.checkSession, userController.newArrivals)





module.exports = router