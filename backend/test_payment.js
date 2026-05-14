
const axios = require('axios');

async function testCreateOrder() {
  try {
    const res = await axios.post('http://localhost:5000/payment/create-order', {
      prescription_id: 'b8108ac3-8cfb-42b3-b1b4-4a061dbd89ac',
      patient_id: 'b622839b-e85d-4112-9c1a-64f339f4d7b7' // Ashleys ID from previous logs
    });
    console.log('Order Success:', res.data);
  } catch (err) {
    console.error('Order Failed:', err.response?.data || err.message);
  }
}

testCreateOrder();
