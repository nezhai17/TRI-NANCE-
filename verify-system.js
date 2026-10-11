// End-to-end live system verification for Tri-nance
const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('🚀 Starting TRi-NANCE Live System Verification...\n');
  let failures = 0;

  async function testRoute(name, url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        console.log(`✅ [PASS] ${name} -> HTTP ${res.status}`);
        return res;
      } else {
        console.error(`❌ [FAIL] ${name} -> HTTP ${res.status}`);
        failures++;
        return res;
      }
    } catch (err) {
      console.error(`❌ [FAIL] ${name} -> Network error: ${err.message}`);
      failures++;
      return null;
    }
  }

  // 1. Landing and Auth Pages
  await testRoute('Public Landing Page', `${BASE_URL}/`);
  await testRoute('Login Screen', `${BASE_URL}/login`);
  await testRoute('Registration Screen', `${BASE_URL}/register`);
  await testRoute('Password Reset Screen', `${BASE_URL}/forgot-password`);

  // 2. Analyst Authentication & Session Creation
  console.log('\n🔑 Authenticating Analyst session...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'analyst@trinance.io',
      password: 'Trinance2026!',
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Failed to authenticate analyst test user');
    process.exit(1);
  }

  const rawCookie = loginRes.headers.get('set-cookie');
  console.log('✅ Analyst session authenticated successfully.');

  const authHeaders = {
    Cookie: rawCookie ? rawCookie.split(';')[0] : '',
    'Content-Type': 'application/json',
  };

  // 3. Authenticated Dashboard Routes
  console.log('\n📊 Testing Protected Dashboard Routes...');
  await testRoute('Overview Dashboard', `${BASE_URL}/dashboard`, { headers: authHeaders });
  await testRoute('New Analysis Studio', `${BASE_URL}/dashboard/analyze`, { headers: authHeaders });
  await testRoute('Analysis Audit Archive', `${BASE_URL}/dashboard/history`, { headers: authHeaders });
  await testRoute('Executive Reports Hub', `${BASE_URL}/dashboard/reports`, { headers: authHeaders });
  await testRoute('Investigations & Governance Workspace', `${BASE_URL}/dashboard/investigations`, { headers: authHeaders });
  await testRoute('Document Library', `${BASE_URL}/dashboard/documents`, { headers: authHeaders });
  await testRoute('Settings & Keys', `${BASE_URL}/dashboard/settings`, { headers: authHeaders });

  // 4. Run Live Analysis on Commercial Disclosure
  console.log('\n🧠 Executing Live Multi-Category Risk & Sentiment Analysis...');
  const docTextA = `
    Q3 2025 Financial Disclosure:
    Operating Revenue reached $124.5 million, reflecting steady order intake.
    However, component shortages in the supply chain caused significant shipping delays.
    Gross Margin was reported at 31.2%, with DSO expanding to 52 days.
    Operating cash reserves remained stable at $28.0M.
  `;

  const analyzeResA = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Q3 2025 Performance Filing',
      inputText: docTextA,
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
    }),
  });

  const recordA = await analyzeResA.json();
  if (analyzeResA.ok && recordA && recordA.id) {
    console.log(`✅ Live Analysis A Generated (ID: ${recordA.id}, Findings: ${recordA.findings?.length || 0})`);
  } else {
    console.error('❌ Failed to run Live Analysis A', recordA);
    failures++;
  }

  const docTextB = `
    Q4 2025 Financial Disclosure:
    Operating Revenue contracted to $98.0 million due to severe customer churn.
    The company is in breach of the minimum liquidity debt covenant under the senior credit facility.
    Global logistics disruption continued to paralyze component delivery.
    Management notes substantial doubt about going concern without an emergency equity infusion.
  `;

  const analyzeResB = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Q4 2025 Annual 10-K Filing',
      inputText: docTextB,
      sourceType: 'pasted_text',
      sourceCategory: 'regulatory_filing',
      analysisMode: 'combined',
    }),
  });

  const recordB = await analyzeResB.json();
  if (analyzeResB.ok && recordB && recordB.id) {
    console.log(`✅ Live Analysis B Generated (ID: ${recordB.id}, Findings: ${recordB.findings?.length || 0})`);
  } else {
    console.error('❌ Failed to run Live Analysis B', recordB);
    failures++;
  }

  // 5. Finding Triage & Audit Lifecycle Updates
  if (recordB?.findings?.length > 0) {
    const findingToTriage = recordB.findings[0];
    console.log(`\n⚖️ Testing Finding Governance Workflow on Finding: "${findingToTriage.title}"...`);

    // Test transition to under_review with note
    const patchRes1 = await fetch(`${BASE_URL}/api/findings/${findingToTriage.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        analysisId: recordB.id,
        reviewStatus: 'under_review',
        noteText: 'Risk committee opened inquiry with Treasury re: lender waiver negotiations.',
      }),
    });
    const patchData1 = await patchRes1.json();
    if (patchRes1.ok && patchData1.finding?.reviewStatus === 'under_review') {
      console.log('✅ Finding transitioned to "under_review" with audit note logged.');
    } else {
      console.error('❌ Failed to update finding status to under_review', patchData1);
      failures++;
    }

    // Test mandatory dismissal justification validation
    const invalidDismissRes = await fetch(`${BASE_URL}/api/findings/${findingToTriage.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        analysisId: recordB.id,
        reviewStatus: 'dismissed',
        resolutionReason: '', // Empty reason should fail!
      }),
    });
    if (invalidDismissRes.status === 400) {
      console.log('✅ Mandatory justification safeguard correctly rejected empty dismissal rationale (HTTP 400).');
    } else {
      console.error('❌ Security safeguard failed: empty dismissal was not rejected');
      failures++;
    }
  }

  // 6. Cross-Document Comparative Investigation
  if (recordA?.id && recordB?.id) {
    console.log('\n🔬 Testing Cross-Document Comparative Investigation Engine...');
    const compRes = await fetch(`${BASE_URL}/api/investigations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        analysisIds: [recordA.id, recordB.id],
        title: 'Q3 vs Q4 Solvency & Covenant Audit',
      }),
    });

    const compData = await compRes.json();
    if (compRes.ok && compData.comparison) {
      console.log(`✅ Cross-Document Audit Completed Successfully:`);
      console.log(`   - Title: "${compData.comparison.title}"`);
      console.log(`   - Sentiment Trajectory: ${compData.comparison.sentimentTrajectory.map(t => `${t.documentTitle} (${t.overall})`).join(' -> ')}`);
      console.log(`   - Recurring Risk Themes: ${compData.comparison.recurringRiskThemes.length} category(ies)`);
      console.log(`   - Newly Emerged Risks: ${compData.comparison.newlyObservedRisks.length} category(ies)`);
      console.log(`   - Contradictions & Discrepancies: ${compData.comparison.contradictionsBetweenDocuments.length} detected`);
    } else {
      console.error('❌ Failed to generate cross-document comparison', compData);
      failures++;
    }
  }

  console.log(`\n🏁 Verification finished with ${failures} failure(s).\n`);
  if (failures === 0) {
    console.log('🎉 ALL TRI-NANCE ENDPOINTS, AUDIT CONTROLS, AND ENGINES FULLY OPERATIONAL!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
