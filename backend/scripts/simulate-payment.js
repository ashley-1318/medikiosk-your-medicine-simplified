const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function simulate() {
  console.log('🚀 Starting Payment Simulation...');

  // 1. Find the latest pending payment
  const { data: payment, error: findError } = await supabase
    .from('payments')
    .select('*, prescriptions(id)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !payment) {
    console.error('❌ No pending payments found. Please open the "Pay & Collect" screen on the kiosk first!');
    return;
  }

  console.log(`✅ Found Pending Order: ${payment.razorpay_order_id}`);
  console.log('⏳ Simulating success signal from Razorpay...');

  // 2. Update status to 'paid'
  const { error: updateError } = await supabase
    .from('payments')
    .update({ 
      status: 'paid', 
      paid_at: new Date().toISOString(),
      razorpay_payment_id: 'pay_simulated_' + Math.random().toString(36).substring(7)
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('❌ Failed to update payment:', updateError);
    return;
  }

  // 3. Update prescription status
  await supabase
    .from('prescriptions')
    .update({ payment_status: 'paid' })
    .eq('id', payment.prescription_id);

  console.log('🎉 SUCCESS! Your Kiosk should now be showing the Dispensing screen.');
}

simulate();
