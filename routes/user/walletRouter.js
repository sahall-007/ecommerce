const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const walletController = require('../../controller/user/walletController.js')
const uploads = require('../../middlewares/multer.js')


const router = express.Router()

router.route('/wallet')
    .get(middleware.checkSession, walletController.getWalletPage)

router.route('/wallet/:page')
    .get(middleware.checkSession, walletController.pagination)






module.exports = router