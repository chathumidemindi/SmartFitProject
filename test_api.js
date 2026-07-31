const payload = {
  gender: "male",
  measurements: {
    height: 180,
    shoulderWidth: 48,
    chest: 105,
    waist: 85,
    hip: 95
  }
};

fetch('http://localhost:5000/api/body/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(r => r.json())
  .then(data => console.log('RESPONSE:', data))
  .catch(err => console.error(err));
