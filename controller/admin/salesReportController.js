

const orderSchema = require('../../model/orderSchema.js')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const logger = require('../../config/pinoLogger.js')

const salesReport = async (req, res) => {
    try{
        let { timeFrame, startDate, endDate } = req.query
        let filter 
        
        if(timeFrame=="weekly"){
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
            const start = new Date()
            start.setMonth(0)
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
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$lte: end} }
            }
        }
        else if(startDate && endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            
            const end = new Date(endDate)
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)
            
            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame=="monthly"){
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

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)
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
            {$sort: {_id: -1}}
        ])
        
        res.render('admin/salesReport', {orders, timeFrame})
    }
    catch(err){
        console.log(err)
        console.log("failed to load admin dashboard!")
    }
}

const applyFilter = async (req, res) => {
    try{
        let { timeFrame, startDate, endDate } = req.body
        let filter 

        
        if(timeFrame!="custom"){
            startDate = ""
            endDate = ""
        }
        
        if(timeFrame=="weekly"){
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
            const start = new Date()
            start.setMonth(0)
            start.setDate(1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setFullYear(start.getFullYear() + 1)
            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame=="monthly"){
            filter = {
                $match:{
                    $expr: {
                        $and: [{$eq: [{$month: "$createdAt"}, {$month: "$$NOW"}]}, {$eq: [{$year: "$createdAt"}, {$year: "$$NOW"}]}]
                    }
                }
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
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$lte: end} }
            }
        }
        else if(startDate && endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        
        else{
            timeFrame = "daily"

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(start.getDate() + 1)
            end.setHours(0, 0, 0, 0)
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
            {$sort: {_id: -1}}
        ])

        res.status(200).json({orders, timeFrame})
    }
    catch(err){
        console.log(err)
        console.log("failed to load admin dashboard!")
    }
}

const pdfDownload = async (req, res) => {
    let { timeFrame, startDate, endDate } = req.query
        let filter 
        let totalRevenue = 0
        let totalOrder = 0
        let totalDiscountPrice = 0
        let couponDiscountAmount = 0
        
        if(timeFrame=="weekly"){
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
            const start = new Date()
            start.setMonth(0)
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
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$lte: end} }
            }
        }
        else if(startDate && endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame=="monthly"){
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

        console.log(orders)

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


}

const excelDownload = async(req, res) => {
    try{
        let { timeFrame, startDate, endDate } = req.query
        let filter 

        if(timeFrame=="weekly"){
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
            const start = new Date()
            start.setMonth(0)
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
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$lte: end} }
            }
        }
        else if(startDate && endDate){
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setDate(end.getDate() + 1)
            end.setHours(0, 0, 0, 0)

            filter = {
                $match: { createdAt: {$gte: start, $lt: end} }
            }
        }
        else if(timeFrame=="monthly"){
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


        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("orders")

        sheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Order ID', key: 'order_id', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Customer', key: 'customer', width: 25 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Coupon', key: 'coupon', width: 15 },
        ]

        orders.forEach((ele, index) => {
            sheet.addRow({
                no: index+1,
                order_id: ele.orderId,
                date:  new Date(ele.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                }),
                customer: ele.user.username,
                amount: ele.payablePrice,
                discount: ele.totalDiscountPrice, // this is  discount of product/category/brand
                coupon: ele.discountAmount         // this is coupon discount
            })
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
        
        await workbook.xlsx.write(res);
    }
    catch(err){
        logger.fatal(err)
        logger.fatal("failed to download excel sheet sales report")
        res.status(500).json({success: false, message: "something went wrong (excel sheet download)"})
    }
}



module.exports = {
    pdfDownload,
    excelDownload,
    salesReport,
    applyFilter
}