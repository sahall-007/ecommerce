const express = require('express')
const categoryController = require('../../controller/admin/categoryController.js')
const offercontroller = require('../../controller/admin/offercontroller.js')
const middleware = require('../../middlewares/adminAuth.js')

const router = express.Router()

router.route('/offer')
    .get(middleware.checkSession, offercontroller.offerManagement)

router.route('/addOffer')
    .get(middleware.checkSession, offercontroller.addOfferPage)

router.route('/editOffer/:name')
    .get(middleware.checkSession, offercontroller.editOfferPage)
    .post(middleware.checkSession, offercontroller.editOfferPost)

router.route('/blockOffer')
    .patch(middleware.checkSession, offercontroller.blockOffer)

router.route('/unBlockOffer')
    .patch(middleware.checkSession, offercontroller.unBlockOffer)


// ========= search result =========
router.route('/productSearch')
    .post(middleware.checkSession, offercontroller.search)

router.route('/addOffer')
    .post(middleware.checkSession, offercontroller.addOfferPost)

router.route('/offer/:page')
    .get(middleware.checkSession, offercontroller.pagination)


module.exports = router