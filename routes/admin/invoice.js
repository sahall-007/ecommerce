// routes/invoice.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const authMiddleware = require('../../middlewares/adminAuth'); // your auth middleware
const orderSchema = require('../../model/orderSchema.js')

const logger = require('../../config/pinoLogger.js')

router.get('/salesReport', authMiddleware.checkSession, async (req, res) => {
    let { timeFrame, startDate, endDate } = req.query
        let filter 
        let totalRevenue = 0
        let totalOrder = 0
        let totalDiscountPrice = 0
        let couponDiscountAmount = 0
        
        if(timeFrame=="weekly"){
            logger.info("weekly")

            const currentDate = new Date()
            let monthDate = currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -7 : 0);

            let start = new Date(currentDate.setDate(monthDate))
            start.setHours(0, 0, 0, 0)

            let end = new Date(start)
            end.setDate(monthDate + 7)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame == "yearly"){
            logger.info("daily")

            const start = new Date()
            start.setMonth(1)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setFullYear(start.getFullYear() + 1)
            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(startDate && !endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$gte: start} }
            }
        }
        else if(endDate && !startDate){
            const end = new Date(endDate)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$lte: end} }
            }
        }
        else if(startDate && endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame=="monthly"){
            logger.info("monthly")
            filter = {
                $match:{
                    $expr: {
                        $and: [{$eq: [{$month: "$createdAt"}, {$month: "$$NOW"}]}, {$eq: [{$year: "$createdAt"}, {$year: "$$NOW"}]}]
                    }
                }
            }
        }
        else{
            timeFrame = "daily"

            logger.info("daily")
            const start = new Date()
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(start.getDate() + 1)
            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }

        const orders = await orderSchema.aggregate([
            filter,
            {$addFields: {
                
                totalOriginalPrice: {
                    $reduce: {
                        input: "$items",
                        initialValue: 0,
                        in: {$add: ["$$value", "$$this.price"]}
                    } 
                },
                totalPriceAfterDiscount: {
                    $reduce: {
                        input: "$items",
                        initialValue: 0,
                        in: {$add: ["$$value", "$$this.priceAfterDiscount"]}
                    } 
                }                               
            }},
            {$addFields: {
                totalDiscountPrice: {
                    $subtract: ["$totalOriginalPrice", "$totalPriceAfterDiscount"]
                }                
            }}, 
            {$lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }},
            {$unwind: "$user"},

            {$project: {
                _id: 1,
                orderId: 1,
                payablePrice: 1,
                discountAmount: 1,
                totalDiscountPrice: 1,
                createdAt: 1,
                "user.username": 1
            }},
        ])

        orders.forEach(ele => {
            totalRevenue += ele.payablePrice
            totalOrder++
            totalDiscountPrice += ele.totalDiscountPrice
            couponDiscountAmount += ele.discountAmount
        })

        // ------------------ PDF Generation Starts Here ------------------

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

        // Pipe the PDF directly to response (user downloads it immediately)
        doc.pipe(res);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;
        const bottomLimit = pageHeight - margin;

        const rowHeight = 20;

        // Column X positions (tuned for A4)
        const colX = {
        no: margin,
        orderId: margin + 40,
        date: margin + 150,
        customer: margin + 260,
        amount: margin + 420,
        };

        // ------------------ FUNCTIONS ------------------

        function drawTitle() {
        doc.fontSize(20).font('Helvetica-Bold').text('Sales Report', {
            align: 'center',
        });
        doc.moveDown(1.5);
        }

        function drawSummary() {
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Orders: ${totalOrder}`);
        doc.text(`Total Revenue: ₹ ${totalRevenue.toFixed(2)}`);
        doc.text(`Total Product Discount: ₹ ${totalDiscountPrice.toFixed(2)}`);
        doc.text(`Total Coupon Discount: ₹ ${couponDiscountAmount.toFixed(2)}`);
        doc.moveDown(1.5);
        }

        function drawTableHeader(y) {
        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('No.', colX.no, y);
        doc.text('Order ID', colX.orderId, y);
        doc.text('Date', colX.date, y);
        doc.text('Customer', colX.customer, y);
        doc.text('Amount', colX.amount, y);
        }

        function addNewPage() {
        doc.addPage();
        drawTitle();
        drawTableHeader(doc.y);
        return doc.y + rowHeight;
        }

        // ------------------ START DRAWING ------------------

        drawTitle();
        drawSummary();

        // Initial table header
        let currentY = doc.y;
        drawTableHeader(currentY);
        currentY += rowHeight;

        doc.font('Helvetica').fontSize(10);

        // ------------------ TABLE ROWS ------------------

        orders.forEach((order, index) => {

        // Auto page break
        if (currentY + rowHeight > bottomLimit) {
            currentY = addNewPage();
        }

        doc.text(index + 1, colX.no, currentY);
        doc.text(`#${order.orderId}`, colX.orderId, currentY);
        doc.text(
            new Date(order.createdAt).toLocaleDateString('en-GB'),
            colX.date,
            currentY
        );
        doc.text(order.user.username, colX.customer, currentY, {
            width: 140,
            ellipsis: true,
        });
        doc.text(`₹ ${order.payablePrice.toFixed(2)}`, colX.amount, currentY, {
            align: 'right',
        });

        currentY += rowHeight;
        });

        // ------------------ FOOTER ------------------

        doc.moveDown(2);
        doc.fontSize(9).text(
        `Generated on ${new Date().toLocaleDateString('en-GB')}`,
        { align: 'center' }
        );

        // ------------------ FINALIZE PDF ------------------
        doc.end();


})

module.exports = router;