const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('https://nexora-backend-2zw6.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@nexorapower.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (data.token) {
      // Now test project creation
      const projectResponse = await fetch('https://nexora-backend-2zw6.onrender.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          customerName: 'Test Customer',
          phone: '+91-9876543210',
          email: 'test@example.com',
          address: 'Test Address',
          systemSize: 5,
          totalCost: 500000,
          stage: 'lead',
          netMeterStatus: 'pending',
          subsidyStatus: 'pending'
        })
      });

      const projectData = await projectResponse.json();
      console.log('Project creation response:', projectData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();