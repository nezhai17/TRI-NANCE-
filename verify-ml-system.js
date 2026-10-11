async function testMLSystem() {
  // 1. Login as default analyst
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'analyst@trinance.io', password: 'Trinance2026!' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login Status:', loginRes.status, 'Cookie exists:', !!cookie);

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: cookie || '',
  };

  // 2. Test GET /api/ml/datasets
  const dsRes = await fetch('http://localhost:3000/api/ml/datasets?task=sentiment_classification', {
    headers: authHeaders,
  });
  const dsData = await dsRes.json();
  console.log('Datasets Status:', dsRes.status, 'Total records:', dsData.stats?.totalCount);

  // 3. Test POST /api/ml/train
  const trainRes = await fetch('http://localhost:3000/api/ml/train', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ task: 'sentiment_classification' }),
  });
  const trainData = await trainRes.json();
  console.log('Train Status:', trainRes.status, 'Winner:', trainData.report?.winningAlgorithm);
  console.log('Validation Macro F1:', trainData.report?.benchmarks?.[0]?.validationMacroF1);

  // 4. Test POST /api/ml/predict
  const predRes = await fetch('http://localhost:3000/api/ml/predict', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      task: 'sentiment_classification',
      text: 'Gross revenues expanded 28% year-over-year with record EBITDA margins and dividend increases.',
    }),
  });
  const predData = await predRes.json();
  console.log('Predict Status:', predRes.status, 'Predicted:', predData.result?.predictedLabel, 'Confidence:', predData.result?.confidence);

  // 5. Test Live Analysis Pipeline Integration
  const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'SEC 10-K Live Inference Test',
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
      inputText: 'Severe supply chain bottlenecks caused complete manufacturing shutdowns, resulting in cancelled orders and unfulfilled commitments.',
    }),
  });
  const analyzeData = await analyzeRes.json();
  console.log('Analyze Status:', analyzeRes.status, 'Analysis ID:', analyzeData.id);
  console.log('Analysis ML Model Version:', analyzeData.sentimentResult?.mlInference?.modelVersion);
  console.log('Analysis ML Predicted Label:', analyzeData.sentimentResult?.mlInference?.predictedLabel);
  console.log('Analysis ML Confidence:', analyzeData.sentimentResult?.mlInference?.confidence);
  console.log('Analysis ML Salient Features:', analyzeData.sentimentResult?.mlInference?.featureWeights?.map(f => f.term));
}

testMLSystem().catch(console.error);
