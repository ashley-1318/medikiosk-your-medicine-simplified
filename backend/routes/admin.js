const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// 1. GET /admin/stats — Enhanced Dashboard Home
router.get('/stats', async (req, res) => {
  try {
    console.log('[Admin Stats] Fetching dashboard data...');
    
    // 1. Inventory Data
    const { data: inventoryData, error: invErr } = await supabase.from('inventory').select('stock_quantity, low_stock_threshold');
    if (invErr) console.error('[Admin Stats] Inventory Error:', invErr);

    // 2. Pending Count
    const { count: pendingCount, error: pendErr } = await supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (pendErr) console.error('[Admin Stats] Prescription Error:', pendErr);

    // 3. Dispense Logs
    const { data: dispenseData, error: dispErr } = await supabase.from('dispense_logs').select('dispensed_at');
    if (dispErr) console.error('[Admin Stats] Dispense Error:', dispErr);

    // 4. Status Breakdown
    const { data: prescriptions, error: statusErr } = await supabase.from('prescriptions').select('status');
    if (statusErr) console.error('[Admin Stats] Status Error:', statusErr);

    // 5. Machine Status
    const { data: machines, error: machErr } = await supabase.from('machine_status').select('*');
    if (machErr) console.error('[Admin Stats] Machine Error:', machErr);

    // 6. Revenue Today
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('amount, paid_at')
      .eq('status', 'paid');
    if (payErr) console.error('[Admin Stats] Revenue Error:', payErr);

    // --- Processing ---
    const today = new Date().toISOString().split('T')[0];
    const dispensedToday = dispenseData?.filter(d => d.dispensed_at?.startsWith(today)).length || 0;
    const lowStockCount = inventoryData?.filter(i => i.stock_quantity < i.low_stock_threshold).length || 0;
    
    const revenueToday = payments?.filter(p => p.paid_at?.startsWith(today))
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // Chart 2: 30-Day Dispense Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const trendMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap[d.toISOString().split('T')[0]] = 0;
    }
    
    dispenseData?.forEach(log => {
      if (log.dispensed_at) {
        const date = log.dispensed_at.split('T')[0];
        if (trendMap[date] !== undefined) trendMap[date]++;
      }
    });
    const lineChartData = Object.keys(trendMap).map(date => ({ date, count: trendMap[date] })).reverse();

    // Chart 3: Prescription Breakdown
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    prescriptions?.forEach(p => {
      if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
    });
    const pieChartData = [
      { name: 'Pending', value: statusCounts.pending, color: '#d4a853' },
      { name: 'Approved', value: statusCounts.approved, color: '#1a3a2a' },
      { name: 'Rejected', value: statusCounts.rejected, color: '#ef4444' }
    ];

    res.json({
      summary: {
        dispensedToday,
        activeSkus: inventoryData?.length || 0,
        pendingPrescriptions: pendingCount || 0,
        lowStockCount,
        revenueToday
      },
      charts: {
        lineChartData,
        pieChartData
      },
      machines: machines || []
    });
  } catch (err) {
    console.error('[Admin Stats] Critical Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 2. GET /admin/inventory — Detailed Inventory
router.get('/inventory', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        medicines (name, generic_name, category)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /admin/alerts — Alerts Center
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
        console.error('[Admin Alerts] Error:', error);
        return res.json([]); // Return empty if table doesn't exist yet
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... (remaining routes with same resilience)
router.patch('/alerts/:id', async (req, res) => {
  try {
    const { is_resolved } = req.body;
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_resolved, resolved_at: is_resolved ? new Date().toISOString() : null })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, is_active } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ role, is_active })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const { data: logs } = await supabase.from('dispense_logs').select('*');
    const { data: patients } = await supabase.from('users').select('id').eq('role', 'patient');
    const { data: inventory } = await supabase.from('inventory').select('id');
    const { data: payments } = await supabase.from('payments').select('amount, paid_at').eq('status', 'paid');

    const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // 30-Day Revenue Trend
    const revenueMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revenueMap[d.toISOString().split('T')[0]] = 0;
    }
    payments?.forEach(p => {
      if (p.paid_at) {
        const date = p.paid_at.split('T')[0];
        if (revenueMap[date] !== undefined) revenueMap[date] += parseFloat(p.amount);
      }
    });
    const revenueTrend = Object.keys(revenueMap).map(date => ({ date, amount: revenueMap[date] })).reverse();

    res.json({
      totalDispenses: logs?.length || 0,
      totalPatients: patients?.length || 0,
      activeMedicines: inventory?.length || 0,
      mostDispensed: 'Metformin',
      totalRevenue,
      revenueTrend,
      hourlyUsage: Array.from({length: 24}, (_, i) => ({ hour: `${i}:00`, count: 0 }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) return res.json([]);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    const { error } = await supabase.from('settings').upsert(settings, { onConflict: 'key' });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/machines', async (req, res) => {
  try {
    const { machine_id, location } = req.body;
    const { data, error } = await supabase
      .from('machine_status')
      .upsert({ machine_id, location, status: 'online', last_active: new Date().toISOString() })
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dispense_logs')
      .select(`
        *,
        users!patient_id (name)
      `)
      .order('dispensed_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const { name, generic_name, category, stock_quantity, expiry_date, threshold, price, slot } = req.body;
    const { data: med, error: medErr } = await supabase
      .from('medicines')
      .insert([{ name, generic_name, category }])
      .select().single();
    if (medErr) throw medErr;

    const { data: inv, error: invErr } = await supabase
      .from('inventory')
      .insert([{
        medicine_id: med.id,
        stock_quantity: parseInt(stock_quantity),
        low_stock_threshold: parseInt(threshold),
        expiry_date,
        unit_price: parseFloat(price),
        slot_number: slot,
        category
      }])
      .select().single();
    if (invErr) throw invErr;

    res.json({ success: true, id: inv.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
