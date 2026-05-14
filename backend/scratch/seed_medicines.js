const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const MEDICINES = [
  { name: "Paracetamol 650mg", category: "Analgesic", unit_price: 2.5 },
  { name: "Amoxicillin 500mg", category: "Antibiotic", unit_price: 8.0 },
  { name: "Azithromycin 500mg", category: "Antibiotic", unit_price: 15.0 },
  { name: "Cetirizine 10mg", category: "Antihistamine", unit_price: 3.5 },
  { name: "Pantoprazole 40mg", category: "Antacid", unit_price: 12.0 },
  { name: "Metformin 500mg", category: "Antidiabetic", unit_price: 4.5 },
  { name: "Atorvastatin 10mg", category: "Statins", unit_price: 10.0 },
  { name: "Amlodipine 5mg", category: "Antihypertensive", unit_price: 5.0 },
  { name: "Ibuprofen 400mg", category: "NSAID", unit_price: 4.0 },
  { name: "Omeprazole 20mg", category: "Antacid", unit_price: 7.5 },
  { name: "Losartan 50mg", category: "Antihypertensive", unit_price: 9.0 },
  { name: "Telmisartan 40mg", category: "Antihypertensive", unit_price: 14.0 },
  { name: "Domperidone 10mg", category: "Antiemetic", unit_price: 6.0 },
  { name: "Ranitidine 150mg", category: "Antacid", unit_price: 2.0 },
  { name: "Diclofenac 50mg", category: "NSAID", unit_price: 5.5 },
  { name: "Montelukast 10mg", category: "Antiasthmatic", unit_price: 18.0 },
  { name: "Levocetirizine 5mg", category: "Antihistamine", unit_price: 4.5 },
  { name: "Gabapentin 300mg", category: "Anticonvulsant", unit_price: 25.0 },
  { name: "Metoprolol 25mg", category: "Beta-blocker", unit_price: 7.0 },
  { name: "Rosuvastatin 10mg", category: "Statins", unit_price: 16.0 },
  { name: "Spironolactone 25mg", category: "Diuretic", unit_price: 8.5 },
  { name: "Furosemide 40mg", category: "Diuretic", unit_price: 3.0 },
  { name: "Digoxin 0.25mg", category: "Cardiac Glycoside", unit_price: 1.5 },
  { name: "Clopidogrel 75mg", category: "Antiplatelet", unit_price: 11.0 },
  { name: "Warfarin 2mg", category: "Anticoagulant", unit_price: 6.5 },
  { name: "Prednisolone 5mg", category: "Steroid", unit_price: 2.5 },
  { name: "Dexamethasone 0.5mg", category: "Steroid", unit_price: 1.0 },
  { name: "Levothyroxine 50mcg", category: "Hormone", unit_price: 3.0 },
  { name: "Ciprofloxacin 500mg", category: "Antibiotic", unit_price: 9.5 },
  { name: "Doxycycline 100mg", category: "Antibiotic", unit_price: 12.0 },
  { name: "Fluconazole 150mg", category: "Antifungal", unit_price: 20.0 },
  { name: "Albendazole 400mg", category: "Anthelminthic", unit_price: 15.0 },
  { name: "Iron + Folic Acid", category: "Supplement", unit_price: 5.0 },
  { name: "Vitamin B-Complex", category: "Supplement", unit_price: 2.0 },
  { name: "Vitamin C 500mg", category: "Supplement", unit_price: 3.0 },
  { name: "Calcium + Vitamin D3", category: "Supplement", unit_price: 8.0 },
  { name: "Zinc Gluconate", category: "Supplement", unit_price: 4.0 },
  { name: "Salbutamol 2mg", category: "Bronchodilator", unit_price: 1.5 },
  { name: "Theophylline 100mg", category: "Bronchodilator", unit_price: 2.5 },
  { name: "Ondansetron 4mg", category: "Antiemetic", unit_price: 12.5 },
  { name: "Loperamide 2mg", category: "Antidiarrheal", unit_price: 3.5 },
  { name: "Bisacodyl 5mg", category: "Laxative", unit_price: 2.0 },
  { name: "Gliclazide 80mg", category: "Antidiabetic", unit_price: 7.0 },
  { name: "Glimepiride 2mg", category: "Antidiabetic", unit_price: 5.5 },
  { name: "Sitagliptin 50mg", category: "Antidiabetic", unit_price: 35.0 },
  { name: "Vildagliptin 50mg", category: "Antidiabetic", unit_price: 28.0 },
  { name: "Ramipril 5mg", category: "Antihypertensive", unit_price: 6.5 },
  { name: "Enalapril 5mg", category: "Antihypertensive", unit_price: 4.0 },
  { name: "Nitroglycerin 2.5mg", category: "Vasodilator", unit_price: 10.0 },
  { name: "Aspirin 75mg", category: "Antiplatelet", unit_price: 1.0 }
];

async function seed() {
  console.log('🚀 Seeding 50 medicines (Check then Insert/Update)...');

  for (const med of MEDICINES) {
    try {
        // 1. Check medicine
        let { data: existingMed } = await supabase.from('medicines').select('id').eq('name', med.name).maybeSingle();
        let medId;
        if (!existingMed) {
          const { data: newMed, error: insErr } = await supabase.from('medicines').insert({ name: med.name, category: med.category }).select().single();
          if (insErr) continue;
          medId = newMed.id;
        } else {
          medId = existingMed.id;
        }

        // 2. Check inventory
        let { data: existingInv } = await supabase.from('inventory').select('id').eq('medicine_id', medId).maybeSingle();
        if (existingInv) {
          await supabase.from('inventory').update({ unit_price: med.unit_price, stock_quantity: 1000 }).eq('id', existingInv.id);
        } else {
          await supabase.from('inventory').insert({ medicine_id: medId, unit_price: med.unit_price, stock_quantity: 1000, category: med.category, low_stock_threshold: 50 });
        }
        console.log(`✅ ${med.name} seeded at ₹${med.unit_price}`);
    } catch (e) {}
  }
  console.log('✨ Seeding complete!');
}

seed();
