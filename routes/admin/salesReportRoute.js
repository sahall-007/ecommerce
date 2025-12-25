// routes/invoice.js
const express = require('express');
const router = express.Router();
const middleware = require('../../middlewares/adminAuth'); // your auth middleware
const salesReportController = require('../../controller/admin/salesReportController.js')

router.get('/salesReport', middleware.checkSession, salesReportController.salesReport)

router.get('/salesReport/time', middleware.checkSession, salesReportController.salesReport)

router.post('/applyFilter', middleware.checkSession, salesReportController.applyFilter)

router.get('/pdfSalesReport', middleware.checkSession, salesReportController.pdfDownload)

router.get('/excelSalesReport', middleware.checkSession, salesReportController.excelDownload)


module.exports = router;