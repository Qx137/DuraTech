
async function test() {
  try {
    const res = await fetch('https://wutfcyskvfkunmvrvafz.supabase.co/functions/v1/create-contipay-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dGZjeXNrdmZrdW5tdnJ2YWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTg0NzAsImV4cCI6MjA2ODI3NDQ3MH0.R0ogVNfrpZJUV9SK2J2ZjdGU8a6_lyx_UxX-vDOdSQ4'
      },
      body: JSON.stringify({
        orderId: 'test-order',
        amount: 10,
        email: 'test@example.com',
        customerName: 'Test'
      })
    })

    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Response body:', text)
  } catch (err) {
    console.error('Fetch error:', err)
  }
}
test()
