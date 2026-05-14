const express = require('express');
const router = express.Router();
const razorpay = require('../services/razorpay.service');
const crypto = require('crypto');
const supabase = require('../lib/supabase');

// GET /prices - Returns all available medicines and their current prices
router.get('/prices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('unit_price, medicines(id, name, category)');

    if (error) throw error;

    const prices = data.map(item => ({
      id: item.medicines.id,
      name: item.medicines.name,
      category: item.medicines.category,
      price: item.unit_price
    }));

    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /create-order
router.post('/create-order', async (req, res) => {
  try {
    const { prescription_id, patient_id } = req.body;

    // 1. Fetch medicines for pricing
    const { data: prescriptionMeds, error: medError } = await supabase
      .from('prescription_medicines')
      .select('*')
      .eq('prescription_id', prescription_id);

    if (medError) throw medError;

    // 2. Fetch inventory with medicine names to match
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('unit_price, medicines(name)')
      .returns();

    // Create a lookup map for prices
    const priceMap = new Map();
    inventoryData?.forEach(item => {
      if (item.medicines?.name) {
        priceMap.set(item.medicines.name.toLowerCase(), item.unit_price);
      }
    });

    // 3. Calculate totals
    let medicines_cost = 0;
    const items = prescriptionMeds.map(m => {
      const price = priceMap.get(m.medicine_name.toLowerCase()) || 50; // Default price fallback
      const qty = m.quantity || 1;
      const subtotal = price * qty;
      medicines_cost += subtotal;
      return { name: m.medicine_name, qty: qty, price };
    });

    const service_fee = medicines_cost * 0.05;
    const total = medicines_cost + service_fee;
    let amount_paise = Math.round(total * 100);

    // Minimum amount check (Razorpay requires at least 1.00 INR)
    if (amount_paise < 100) amount_paise = 100; 

    // 3. Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount_paise,
      currency: 'INR',
      receipt: `rx_${prescription_id.substring(0, 8)}`,
    });

    // 4. Record in payments table
    const { error: payError } = await supabase
      .from('payments')
      .insert({
        prescription_id,
        patient_id,
        razorpay_order_id: order.id,
        amount: total,
        medicines_cost,
        service_fee,
        status: 'pending'
      });

    if (payError) throw payError;

    res.json({
      order_id: order.id,
      amount: total,
      amount_paise,
      currency: 'INR',
      medicines_cost,
      service_fee,
      medicines: items,
      prescription_id,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('[Payment Order] Error:', error);
    res.status(500).json({ error: error.message || 'Unknown error creating order' });
  }
});

// POST /create-qr
router.post('/create-qr', async (req, res) => {
  try {
    const { order_id, prescription_id, amount_paise } = req.body;

    const qr = await razorpay.qrCode.create({
      type: 'upi_qr',
      name: 'MEDIKIOSK',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amount_paise,
      description: 'Medicine Payment',
      close_by: Math.floor(Date.now() / 1000) + 600,
    });

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        qr_id: qr.id,
        qr_image_url: qr.image_url,
        qr_expires_at: new Date(Date.now() + 600000).toISOString()
      })
      .eq('razorpay_order_id', order_id);

    if (updateError) throw updateError;

    res.json({
      qr_id: qr.id,
      qr_image_url: qr.image_url,
      expires_at: Date.now() + 600000
    });
  } catch (error) {
    console.error('[Payment QR] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Unknown error creating QR code',
      details: error.error?.description || error.description || null
    });
  }
});

// POST /verify
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, prescription_id } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Update status
    await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: 'card'
      })
      .eq('razorpay_order_id', razorpay_order_id);

    await supabase
      .from('prescriptions')
      .update({ payment_status: 'paid' })
      .eq('id', prescription_id);

    // Trigger Email (Non-blocking)
    const { data: payRecord } = await supabase.from('payments').select('amount').eq('razorpay_order_id', razorpay_order_id).single();
    triggerPaymentSuccessEmail(prescription_id, razorpay_order_id, razorpay_payment_id, payRecord?.amount || 0, 'card');

    res.json({ success: true, payment_id: razorpay_payment_id });
  } catch (error) {
    console.error('[Payment Verify] Error:', error);
    res.status(500).json({ error: error.message || 'Unknown error during verification' });
  }
});

// POST /webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).send("Invalid webhook");
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'qr_code.credited') {
      const order_id = payload.payment?.entity?.order_id || payload.qr_code?.entity?.notes?.order_id;
      const payment_id = payload.payment?.entity?.id || payload.payment?.entity?.id;

      if (order_id) {
        const { data: payment } = await supabase
          .from('payments')
          .update({ status: 'paid', paid_at: new Date().toISOString(), razorpay_payment_id: payment_id })
          .eq('razorpay_order_id', order_id)
          .select()
          .single();

        if (payment) {
          await supabase
            .from('prescriptions')
            .update({ payment_status: 'paid' })
            .eq('id', payment.prescription_id);

          // Trigger Email (Non-blocking)
          triggerPaymentSuccessEmail(payment.prescription_id, order_id, payment_id, payment.amount, 'upi/qr');
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Payment Webhook] Error:', error);
    res.status(500).send(error.message);
  }
});


/**
 * Helper to trigger Payment Success Email & PDF
 */
async function triggerPaymentSuccessEmail(prescriptionId, orderId, paymentId, amount, method) {
  try {
    const EmailService = require('../lib/email.service');
    const { generateReceiptPDF } = require('../services/pdf.service');

    // 1. Fetch prescription details with patient and doctor
    const { data: prescription, error: pErr } = await supabase
      .from('prescriptions')
      .select('*, users!patient_id(name, email, phone_number), doctors:users!doctor_id(name)')
      .eq('id', prescriptionId)
      .single();

    if (pErr || !prescription) throw new Error('Prescription not found for email');

    // 2. Fetch medicines
    const { data: meds, error: mErr } = await supabase
      .from('prescription_medicines')
      .select('*')
      .eq('prescription_id', prescriptionId);

    if (mErr) throw mErr;

    // 3. Prepare payment data
    const paymentData = {
      receiptId: `RCP-${Date.now().toString().slice(-6)}`,
      transactionId: paymentId,
      paymentMethod: method.toUpperCase(),
      paidAt: new Date().toISOString(),
      patientName: prescription.users?.name || 'Patient',
      doctorName: prescription.doctors?.name || 'Medical Officer',
      prescriptionId: prescriptionId,
      subtotal: amount / 1.18, // Calculate subtotal from total
      tax: amount - (amount / 1.18), // 18% GST
      totalAmount: amount,
      medicines: meds.map(m => ({
        name: m.medicine_name,
        dosage: m.dosage,
        quantity: m.quantity,
        price: (amount / meds.length) // Distributed price for receipt
      }))
    };

    // 4. Generate PDF
    const pdfBuffer = await generateReceiptPDF(paymentData);

    // 5. Send Email
    if (prescription.users?.email) {
      await EmailService.sendPaymentSuccessEmail(
        prescription.users.email,
        prescription.users.name || 'Patient',
        paymentData,
        pdfBuffer
      );

      // 6. Log notification
      await supabase.from('notifications').insert({
        user_id: prescription.patient_id,
        type: 'payment_success',
        title: 'Payment Confirmed ✅',
        message: `Your payment of ₹${amount} was successful. Receipt sent to your email.`,
        is_read: false
      });
    }
  } catch (err) {
    console.error('[Payment Email Trigger] Error:', err);
  }
}

module.exports = router;
