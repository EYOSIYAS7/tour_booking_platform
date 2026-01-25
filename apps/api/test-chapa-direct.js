const axios = require('axios');

const CHAPA_SECRET_KEY = 'C'; // Replace!

async function testChapaDirectly() {
  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: 850,
        currency: 'ETB',
        email: 'user1@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        tx_ref: 'TEST-cmktmfvcb0001o0uygtmdmxse' + Date.now(),
        return_url:
          'http://localhost:3000/payments/callback?booking_id=cmktmfvcb0001o0uygtmdmxse&tx_ref=TXN-cmktmfvcb0001o0uygtmdmxse-1769338879462',

        customization: {
          title: `Payment for booking.tour.name`,
          description: `Tour booking for 10 participant(s)`,
        },
        // Return URL: http://localhost:3000/payments/callback?booking_id=cmktmfvcb0001o0uygtmdmxse&tx_ref=TXN-cmktmfvcb0001o0uygtmdmxse-1769338879462
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ ERROR!');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

testChapaDirectly();
