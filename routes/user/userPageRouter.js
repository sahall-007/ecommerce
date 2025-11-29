
const express = require('express')
const userController = require('../../controller/user/userController.js');
const allProducctController = require('../../controller/user/allProductController.js')
const middleware = require('../../middlewares/userAuth.js')
const searchController = require('../../controller/user/searchController.js');

const router = express.Router()

router.route('/')
    .get(userController.getHomePage)

router.route('/logout')
    .get(userController.logout)

router.route('/productDetail/:id')
    .get(userController.productDetail)

router.route('/allProducts')
    .get(allProducctController.allProducts)

router.route('/filter')
    .get(allProducctController.filterPage)
    .post(allProducctController.filter)

router.route('/allProducts/next')
    .get(allProducctController.nextPage)

router.route('/allProducts/prev')
    .get(allProducctController.prevPage)

// search result
router.route('/search')
    .get(searchController.searchResult)
    .post(allProducctController.search)

router.route('/searchFilter')
    .post(searchController.searchFilter)

// new arrivals
router.route('/newArrivals')
    .get( userController.newArrivals)





module.exports = router