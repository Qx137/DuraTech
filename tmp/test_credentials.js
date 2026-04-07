
async function testCredentials(url, label) {
  const apiKey = "c0hVcDVlbEx3NGVIdkdQQVpLc2ludUtGL0xQUUlJb1k5SnhnQWhsWjFlRT0|";
  const apiSecret = "f071f7df-3886-4259-8e4f-6a4da6131118";
  const merchantId = 797;
  const basicAuth = btoa(`${apiKey}:${apiSecret}`);

  const paymentData = {
      webhookUrl: "http://localhost/webhook",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
      description: "Test",
      amount: 10.00,
      reference: "test-ref",
      merchantId: merchantId,
      currencyCode: 'USD',
      customer: {
          firstName: 'Test',
          surname: 'User',
          middleName: '',
          email: 'test@example.com',
          cell: '0000000000',
          countryCode: 'ZW',
          nationalId: '',
      },
  };

  try {
      const res = await fetch(`${url}/acquire/payment`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify(paymentData)
      });
      const text = await res.text();
      console.log(`\n--- Testing ${label} (${url}) ---`);
      console.log(`Status: ${res.status}`);
      console.log(`Response: ${text.substring(0, 200)}`);
  } catch (err) {
      console.log(`\n--- Testing ${label} (${url}) ---`);
      console.error('Fetch error:', err.message);
  }
}

async function run() {
  await testCredentials("https://api-uat.contipay.net", "UAT");
  await testCredentials("https://api.contipay.net", "Live v1");
  await testCredentials("https://api-v2.contipay.co.zw", "Live v2");
}

run();
