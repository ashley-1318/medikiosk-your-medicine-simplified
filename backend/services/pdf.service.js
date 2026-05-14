const PDFDocument = require('pdfkit');

/**
 * Generates a beautiful MEDIKIOSK Payment Receipt PDF
 */
const generateReceiptPDF = async (paymentData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ========================================
      // PDF DESIGN - MEDIKIOSK RECEIPT
      // ========================================

      // HEADER BACKGROUND (Dark Green)
      doc.rect(0, 0, 595, 160).fill('#1a3a2a');

      // MEDIKIOSK BRAND NAME
      doc.font('Helvetica-Bold')
         .fontSize(28)
         .fillColor('#ffffff')
         .text('MEDIKIOSK', 50, 50, { align: 'center' });

      // TAGLINE
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('rgba(255,255,255,0.6)')
         .text('AI-Powered Medicine Dispensing', 50, 85, { align: 'center' });

      // RECEIPT TITLE (Amber)
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#d4a853')
         .text('PAYMENT RECEIPT', 50, 115, { align: 'center' });

      // ========================================
      // RECEIPT DETAILS SECTION
      // ========================================

      let yPos = 190;

      // SUCCESS BADGE
      doc.roundedRect(197, yPos, 200, 40, 8)
         .fill('#e8f5e9');
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#2e7d32')
         .text('✓  PAYMENT SUCCESSFUL', 197, yPos + 12, 
               { width: 200, align: 'center' });

      yPos += 65;

      // DIVIDER LINE
      doc.moveTo(50, yPos)
         .lineTo(545, yPos)
         .stroke('#e0e0e0');

      yPos += 20;

      // RECEIPT INFO TABLE
      const leftCol = 50;
      const rightCol = 300;
      const rowHeight = 32;

      const receiptDetails = [
        { label: 'Receipt Number:', value: paymentData.receiptId },
        { label: 'Transaction ID:', value: paymentData.transactionId },
        { label: 'Payment Method:', value: paymentData.paymentMethod },
        { label: 'Date & Time:', value: new Date(paymentData.paidAt)
                                  .toLocaleString('en-IN', {
                                    timeZone: 'Asia/Kolkata',
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })},
        { label: 'Patient Name:', value: paymentData.patientName },
        { label: 'Doctor:', value: paymentData.doctorName },
      ];

      receiptDetails.forEach(row => {
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#666666')
           .text(row.label, leftCol, yPos);

        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor('#1a1a1a')
           .text(row.value, rightCol, yPos);

        yPos += rowHeight;
      });

      // DIVIDER
      doc.moveTo(50, yPos)
         .lineTo(545, yPos)
         .stroke('#e0e0e0');

      yPos += 20;

      // MEDICINES TABLE HEADER
      doc.rect(50, yPos, 495, 36).fill('#1a3a2a');
      
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#ffffff')
         .text('MEDICINE', 65, yPos + 12)
         .text('DOSAGE', 240, yPos + 12)
         .text('QTY', 360, yPos + 12)
         .text('PRICE', 460, yPos + 12);

      yPos += 36;

      // MEDICINES ROWS
      paymentData.medicines.forEach((medicine, index) => {
        if (index % 2 === 0) {
          doc.rect(50, yPos, 495, 36).fill('#f9f9f9');
        }

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#1a1a1a')
           .text(medicine.name, 65, yPos + 12)
           .text(medicine.dosage, 240, yPos + 12)
           .text(medicine.quantity.toString(), 360, yPos + 12)
           .text(`₹${medicine.price.toFixed(2)}`, 460, yPos + 12);

        yPos += 36;
      });

      // TOTAL SECTION
      yPos += 10;

      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#666666')
         .text('Subtotal:', 360, yPos);
      doc.font('Helvetica')
         .fillColor('#1a1a1a')
         .text(`₹${paymentData.subtotal.toFixed(2)}`, 460, yPos);

      yPos += 25;

      if (paymentData.tax > 0) {
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#666666')
           .text('GST (18%):', 360, yPos);
        doc.font('Helvetica')
           .fillColor('#1a1a1a')
           .text(`₹${paymentData.tax.toFixed(2)}`, 460, yPos);
        yPos += 25;
      }

      // TOTAL ROW
      doc.rect(340, yPos - 5, 210, 40).fill('#1a3a2a');
      
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor('#ffffff')
         .text('TOTAL PAID:', 360, yPos + 8);
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor('#d4a853')
         .text(`₹${paymentData.totalAmount.toFixed(2)}`, 460, yPos + 8);

      yPos += 60;

      // PAYMENT METHOD BADGE
      doc.roundedRect(50, yPos, 150, 36, 6)
         .fill('#f5f0e8');
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#1a3a2a')
         .text(`💳 ${paymentData.paymentMethod}`, 50, yPos + 12,
               { width: 150, align: 'center' });

      yPos += 60;

      // DIVIDER
      doc.moveTo(50, yPos)
         .lineTo(545, yPos)
         .stroke('#e0e0e0');

      yPos += 20;

      // IMPORTANT NOTES
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#1a3a2a')
         .text('Important Notes:', 50, yPos);

      yPos += 20;

      const notes = [
        '• Please collect your medicines from the kiosk dispensing slot',
        '• Keep this receipt for your records',
        '• Medicines are non-returnable once dispensed',
        '• For queries contact: support@medikiosk.com'
      ];

      notes.forEach(note => {
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#666666')
           .text(note, 50, yPos);
        yPos += 18;
      });

      yPos += 20;

      // QR CODE PLACEHOLDER
      doc.roundedRect(50, yPos, 80, 80, 4)
         .stroke('#cccccc');
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#999999')
         .text('Scan for\ndigital copy', 50, yPos + 30,
               { width: 80, align: 'center' });

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#999999')
         .text(`Receipt ID: ${paymentData.receiptId}`, 150, yPos + 15)
         .text(`Prescription ID: ${paymentData.prescriptionId}`, 150, yPos + 30)
         .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 150, yPos + 45);

      // FOOTER
      const footerY = 750;
      doc.rect(0, footerY, 595, 92).fill('#1a3a2a');

      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#d4a853')
         .text('MEDIKIOSK', 50, footerY + 15, { align: 'center' });

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('rgba(255,255,255,0.6)')
         .text('Your Prescription. Verified. Dispensed.', 
               50, footerY + 33, { align: 'center' })
         .text('www.medikiosk.com | support@medikiosk.com | 1800-MED-KIOSK',
               50, footerY + 50, { align: 'center' })
         .text('© 2026 MEDIKIOSK. All rights reserved.',
               50, footerY + 67, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a beautiful MEDIKIOSK Health Report PDF
 */
const generateHealthReportPDF = async (dispenseData, patientData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // HEADER
      doc.rect(0, 0, 595, 140).fill('#1a3a2a');
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#ffffff').text('MEDIKIOSK HEALTH REPORT', 50, 45, { align: 'center' });
      doc.font('Helvetica').fontSize(10).fillColor('#d4a853').text(`Generated on ${new Date().toLocaleString('en-IN')}`, 50, 80, { align: 'center' });

      let yPos = 160;

      // PATIENT INFO
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a3a2a').text('Patient Information', 50, yPos);
      yPos += 25;
      doc.font('Helvetica').fontSize(11).fillColor('#444444')
         .text(`Name: ${dispenseData.patientName}`, 50, yPos)
         .text(`Phone: ${patientData.phone || 'N/A'}`, 300, yPos);
      yPos += 20;
      doc.text(`Conditions: ${patientData.conditions || 'None'}`, 50, yPos)
         .text(`Allergies: ${patientData.allergies || 'None'}`, 300, yPos);

      yPos += 40;

      // DISPENSED MEDICINES
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a3a2a').text('Medicines Dispensed', 50, yPos);
      yPos += 25;

      doc.rect(50, yPos, 495, 30).fill('#1a3a2a');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
         .text('MEDICINE', 65, yPos + 10)
         .text('DOSAGE', 200, yPos + 10)
         .text('FREQ', 300, yPos + 10)
         .text('QTY', 400, yPos + 10);
      
      yPos += 30;

      dispenseData.medicines.forEach((m, index) => {
        if (index % 2 === 0) doc.rect(50, yPos, 495, 30).fill('#f9f9f9');
        doc.font('Helvetica').fontSize(10).fillColor('#1a1a1a')
           .text(m.name, 65, yPos + 10)
           .text(m.dosage, 200, yPos + 10)
           .text(m.frequency, 300, yPos + 10)
           .text(m.quantity.toString(), 400, yPos + 10);
        yPos += 30;
      });

      yPos += 30;

      // AI INSIGHTS
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a3a2a').text('AI Health Insights', 50, yPos);
      yPos += 25;
      doc.font('Helvetica').fontSize(10).fillColor('#555555');
      dispenseData.healthInsights?.forEach(insight => {
        doc.text(`• ${insight}`, 60, yPos, { width: 480 });
        yPos += (doc.heightOfString(insight, { width: 480 }) + 10);
      });

      yPos += 20;

      // CARE RECOMMENDATIONS
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a3a2a').text('Care Recommendations', 50, yPos);
      yPos += 25;
      doc.font('Helvetica').fontSize(10).fillColor('#555555');
      dispenseData.careRecommendations?.forEach(rec => {
        doc.text(`✓ ${rec}`, 60, yPos, { width: 480 });
        yPos += 20;
      });

      yPos += 30;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#2e7d32').text(`Next Follow-up: ${dispenseData.followUpDate}`, 50, yPos);

      // FOOTER
      doc.rect(0, 750, 595, 92).fill('#1a3a2a');
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#d4a853').text('MEDIKIOSK', 50, 765, { align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.5)').text('© 2026 MEDIKIOSK. All rights reserved.', 50, 785, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateReceiptPDF, generateHealthReportPDF };
