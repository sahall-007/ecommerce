const express = require('express')
const middleware = require('../../middlewares/userAuth.js')
const walletController = require('../../controller/user/walletController.js')
const uploads = require('../../middlewares/multer.js')


const router = express.Router()

router.route('/wallet')
    .get(walletController.getWalletPage)








module.exports = router