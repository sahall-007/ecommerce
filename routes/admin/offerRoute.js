const express = require('express')
const categoryController = require('../../controller/admin/categoryController.js')
const offercontroller = require('../../controller/admin/offercontroller.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()


router.route('/addOffer')
    .get(offercontroller.addOfferPage)

// ========= search result =========
router.route('/productSearch')
    .post(offercontroller.search)

router.route('/addOffer')
    .post(offercontroller.addOfferPost)


module.exports = router