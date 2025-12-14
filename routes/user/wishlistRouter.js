

const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const wishlistController = require('../../controller/user/wishlistController.js')

const router = express.Router()

router.route('/wishlist')
    .get(middleware.checkSession, wishlistController.wishlistPage)
    .post(wishlistController.wishlistPost)

router.route('/moveAllToCart')
    .post(wishlistController.moveAllToCart)

router.route('/removefromWishlist')
    .patch(wishlistController.removeProduct)

module.exports = router