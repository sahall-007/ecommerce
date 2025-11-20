
const express = require('express')

const variantController = require('../../controller/admin/variantController.js')
const middleware = require('../../middlewares/adminAuth.js')
const uploads = require('../../middlewares/multer.js')

const router = express.Router()


router.route('/variant/:id')
    .get(middleware.checkSession, variantController.variantManagement)

router.route('/addVariant/:id')
    .get(middleware.checkSession, variantController.addvariantPage)
    .post(uploads.upload.any(), variantController.addvariantPost)

router.route('/editVariant/:id')
    .get(middleware.checkSession, variantController.editVariantPage)
    .post(uploads.upload.any(), variantController.editVariantPost)

router.route('/deleteImg')
    .post(variantController.deleteImg)

router.route('/blockVariant')
    .patch(variantController.blockVariant)

router.route('/unBlockVariant')
    .patch(variantController.unBlockVariant)


module.exports = router