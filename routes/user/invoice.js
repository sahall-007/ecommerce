// routes/invoice.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Order = require('../../model/orderSchema'); // your order model (lowercase 'o' if filename is order.js)
const authMiddleware = require('../../middlewares/userAuth'); // your auth middleware
const orderSchema = require('../../model/orderSchema.js')


// GET /invoice/ORD-1001
router.get('/invoice/:orderId', authMiddleware.checkSession, async (req, res) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            userId: req.session.user
        });

        if (!order) {
            return res.status(404).send('Order not found or access denied');
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.orderId}.pdf`);
        doc.pipe(res);

        // === INVOICE DESIGN (same as before) ===
        doc.fontSize(22).font('Helvetica-Bold').text('ORDER INVOICE', { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(12).font('Helvetica');
        doc.text('Shop Ease Store', 50);
        doc.text('Palakkad, Kerala, India');
        doc.text('GSTIN: 27ABCDE1234F1Z5');
        doc.text('Phone: +91 9778765901');
        doc.moveDown(2);

        doc.text(`Invoice No: ${order.orderId}`, 400, 120, { align: 'right' });
        doc.text(`Date: ${new Date(order.placedAt).toLocaleDateString('en-IN')}`, 400, 140, { align: 'right' });
        doc.text(`Payment: ${order.paymentMethod}`, 400, 160, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold').text('Bill To:', 50);
        doc.fontSize(12).font('Helvetica');
        doc.text(order.billingAddress.fullname);
        doc.text(order.billingAddress.address);
        doc.text(`${order.billingAddress.city || 'N/A'}, ${order.billingAddress.state || 'N/A'} - ${order.billingAddress.pincode}`);
        doc.text(`Phone: ${order.billingAddress.phone}`);
        doc.moveDown(2);

// ──────────────────────── ITEMS TABLE (NO OVERLAP EVER) ────────────────────────
let startY = doc.y + 30;

// Header
doc.font('Helvetica-Bold').fontSize(12)
   .text('Item Description', 50, startY)
   .text('Qty', 340, startY, { width: 50, align: 'center' })
   .text('Price', 410, startY, { width: 90, align: 'right' })
   .text('Amount', 500, startY, { width: 80, align: 'right' });

doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

let currentY = startY + 30;
let grandTotal = 0;

for (let item of order.items) {
    const price = parseFloat(item.priceAfterCouponDiscount) || 0;
    const amount = price * item.quantity;
    grandTotal += amount;

    const variant = [item.ram, item.storage, item.color].filter(Boolean).join('/');
    const itemName = `${item.name}${variant ? ` (${variant})` : ''}`;

    // This is the magic: let PDFKit auto-calculate height
    const itemHeight = doc.heightOfString(itemName, {
        width: 280,
        align: 'left'
    });

    const lineHeight = Math.max(24, itemHeight + 10);  // at least 24px

    // Draw row
    doc.font('Helvetica').fontSize(11)
       .text(itemName, 50, currentY, {
           width: 280,
           align: 'left',
           lineBreak: true
       })
       .text(item.quantity.toString(), 340, currentY, { width: 50, align: 'center' })
       .text(`₹ ${price.toLocaleString('en-IN')}`, 410, currentY, { align: 'center' })
       .text(`₹ ${amount.toLocaleString('en-IN')}`, 500, currentY, { align: 'right' });

    // Move down by exact height needed
    currentY += lineHeight;
}

// Bottom line
doc.moveTo(50, currentY + 5).lineTo(550, currentY + 5).stroke();

// Grand Total (BOLD & BIG)
doc.font('Helvetica-Bold').fontSize(16)
   .text('Total :', 400, currentY + 25, { width: 100, align: 'right' })
   .text(`₹ ${parseFloat(order.payablePrice).toLocaleString('en-IN')}`, 500, currentY + 25, { width: 80, align: 'right' });

doc.fontSize(12).font('Helvetica')
   .text('Thank you for shopping with us!', 50, currentY + 70, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error("PDF Error:", error);
        res.status(500).send('Error generating invoice');
    }
});

module.exports = router;