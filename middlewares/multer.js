const multer = require("multer")
const fs = require("fs")
const path = require("path")


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage })

// const uploadMiddleware = upload.fields([{ name: 'image-1', maxCount: 10 }])

module.exports = {upload}