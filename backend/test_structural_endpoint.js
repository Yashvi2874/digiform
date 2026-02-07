// Test structural analysis endpoint
const testData = {
  design: {
    type: 'beam',
    parameters: {
      width: 50,
      height: 50,
      length: 200
    }
  },
  material: 'Steel',
  constraints: [
    {
      type: 'fixed',
      face: 'left',
      dof: ['x', 'y', 'z']
    }
  ],
  loads: [
    {
      type: 'force',
      magnitude: 1000,
      direction: [0, -1, 0],
      face: 'right'
    }
  ]
};

fetch('http://localhost:5000/api/structural-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    return response.text();
  })
  .then(text => {
    console.log('Response body:', text);
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });
