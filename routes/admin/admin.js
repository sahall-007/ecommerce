
const express = require('express')
const adminController = require('../../controller/admin/adminController.js')
// const costumerController = require('../../controller/admin/costumerController.js')
// const categoryController = require('../../controller/admin/categoryController.js')
// const productController = require('../../controller/admin/productController.js')
// const brandController = require('../../controller/admin/brandController.js')
// const variantController = require('../../controller/admin/variantController.js')
const middleware = require('../../middlewares/adminAuth.js')
// const uploads = require('../../middlewares/multer.js')

// const productSchema = require('../../model/productSchema.js')
// const variantSchema = require('../../model/variantSchema.js')

const brandRoute = require("./brandRoute.js")
const cateogryRoute = require("./cateogryRoute.js")
const customerRoute = require("./customerRoute.js")
const productRoute = require("./productRoute.js")
const variantRoute = require("./variantRoute.js")
const orderRoute = require('./orderRoute.js')
// const offerRoute = require('./offerRoute.js')

const router = express.Router()


router.route('/login')
    .get(adminController.loadLogin)
    .post(adminController.loginVerify)

router.route('/dashboard')
    .get(middleware.checkSession, adminController.loadDashboard)

router.route('/logout')
    .get(adminController.logout)

// costumer controllers--------------------------
router.use(customerRoute)

// category controllers--------------------------
router.use(cateogryRoute)

// products--------------------------
router.use(productRoute)

// brand --------------------------
router.use(brandRoute)

// variant management--------------------------
router.use(variantRoute)

// order management --------------------
router.use(orderRoute)

// offer management
// router.use(offerRoute)

module.exports = router