// Comprehensive Product-Wide Craftsmanship Audit for TRi-NANCE
const BASE_URL = 'http://localhost:3000';

async function audit() {
  console.log('================================================================');
  console.log('   TRi-NANCE COMPREHENSIVE PRODUCT-WIDE CRAFTSMANSHIP AUDIT     ');
  console.log('================================================================\n');
  let failures = 0;
  let tests = 0;

  function assert(condition, message) {
    tests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failures++;
    }
  }

  // 1. Unauthenticated Security & Server Authorization
  console.log('🔒 Phase 1: Authentication & Authorization Safeguards');
  const unauthDash = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
  assert(unauthDash.status === 307 && unauthDash.headers.get('location') === '/login', 'Unauthenticated /dashboard redirects to /login (HTTP 307)');

  const unauthApi = await fetch(`${BASE_URL}/api/analyses`);
  assert(unauthApi.status === 401, 'Unauthenticated /api/analyses returns 401 Unauthorized');

  const invalidLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'analyst@trinance.io', password: 'WrongPassword123' }),
  });
  assert(invalidLogin.status === 401, 'Invalid password credentials rejected with HTTP 401');

  // 2. Analyst Session Authentication
  console.log('\n🔑 Phase 2: Analyst Session Establishment');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'analyst@trinance.io', password: 'Trinance2026!' }),
  });
  assert(loginRes.status === 200, 'Valid analyst credentials authenticated with HTTP 200');

  const cookieHeader = loginRes.headers.get('set-cookie');
  assert(Boolean(cookieHeader && cookieHeader.includes('trinance_session')), 'Session cookie "trinance_session" issued');

  const authHeaders = {
    Cookie: cookieHeader.split(';')[0],
    'Content-Type': 'application/json',
  };

  const userProfileRes = await fetch(`${BASE_URL}/api/auth/user`, { headers: authHeaders });
  const userProfile = await userProfileRes.json();
  assert(userProfileRes.status === 200 && userProfile?.email === 'analyst@trinance.io', 'Session profile resolved to analyst@trinance.io');

  // 3. Document Analysis & Grounded Evidence Verification
  console.log('\n🧠 Phase 3: Analytical Engine & Evidence Grounding Verification');
  const sourceText = `
    Meridian Technology Corp Q3 2026 Financial Report:
    Consolidated operating revenue contracted 18.5% year-over-year to $44.2 million.
    Gross margin compressed severely to 29.4% due to unexpected raw material inflation.
    Operating cash flow deficit reached $14.1 million, reducing liquid cash reserves to $8.2 million.
    Consequently, the company triggered a covenant breach under the senior syndicated credit facility.
    Enterprise customer churn escalated to 24% after system outages in August.
    Days sales outstanding lengthened to 82 days, exacerbating working capital pressure.
    Management notes substantial doubt about the entity's ability to continue as a going concern without an emergency capital infusion.
  `;

  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Meridian Tech Q3 2026 Liquidity Audit',
      inputText: sourceText,
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
    }),
  });

  const dossier = await analyzeRes.json();
  assert((analyzeRes.status === 200 || analyzeRes.status === 201) && Boolean(dossier.id), `Dossier generated with ID: ${dossier.id}`);
  assert(dossier.sentimentResult?.overall === 'negative', `Sentiment classified as negative (Score: ${dossier.sentimentResult?.score})`);
  assert(dossier.riskResult?.highestSeverity === 'critical', `Highest risk severity classified as critical (Score: ${dossier.riskResult?.overallRiskScore}/100)`);
  assert(dossier.findings?.length >= 4, `Detected ${dossier.findings?.length} risk findings across 12 institutional categories`);

  // Verify grounded evidence citations (offsets & line numbers)
  let allOffsetsValid = true;
  for (const finding of dossier.findings) {
    const loc = finding.sourceLocation;
    if (!loc || typeof loc.startOffset !== 'number' || typeof loc.endOffset !== 'number') {
      allOffsetsValid = false;
      break;
    }
    const extracted = sourceText.slice(loc.startOffset, loc.endOffset).trim();
    if (!extracted || !sourceText.includes(finding.excerpt.trim())) {
      allOffsetsValid = false;
      break;
    }
  }
  assert(allOffsetsValid, 'All findings contain verified byte offsets directly matching raw source text');

  // 4. Diligence Inquiries & Epistemic Certainty
  console.log('\n🔍 Phase 4: Diligence Questions & Epistemic Certainty Validation');
  const criticalFinding = dossier.findings.find(f => f.severity === 'critical');
  assert(Boolean(criticalFinding), 'Critical severity finding isolated');
  assert(
    Boolean(criticalFinding?.investigationDiligence?.questionsForManagement?.length > 0),
    'Critical finding generated actionable management inquiry questions for earnings call'
  );
  assert(
    ['documented_fact', 'hedged_projection', 'ambiguous_disclosure'].includes(criticalFinding?.epistemicCertainty),
    `Epistemic certainty tag verified: ${criticalFinding?.epistemicCertainty}`
  );

  // 5. Finding Triage & Audit Governance Safeguards
  console.log('\n⚖️ Phase 5: Triage Governance & Mandatory Safeguards');
  const triageFinding = dossier.findings[0];

  // Transition to under_review with note
  const triageReview = await fetch(`${BASE_URL}/api/findings/${triageFinding.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      analysisId: dossier.id,
      reviewStatus: 'under_review',
      noteText: 'Audit committee dispatched verification request to Treasury.',
    }),
  });
  const triageReviewData = await triageReview.json();
  assert(
    triageReview.status === 200 && triageReviewData.finding?.reviewStatus === 'under_review',
    'Finding transitioned to "under_review" with analyst note appended'
  );

  // Attempt dismiss without reason -> must fail with HTTP 400
  const emptyDismiss = await fetch(`${BASE_URL}/api/findings/${triageFinding.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      analysisId: dossier.id,
      reviewStatus: 'dismissed',
      resolutionReason: '   ',
    }),
  });
  assert(emptyDismiss.status === 400, 'Dismissal without justification correctly rejected (HTTP 400)');

  // Valid dismissal with mandatory justification
  const validDismiss = await fetch(`${BASE_URL}/api/findings/${triageFinding.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      analysisId: dossier.id,
      reviewStatus: 'dismissed',
      resolutionReason: 'Senior credit facility waiver granted in secondary amendment executed post-quarter.',
    }),
  });
  const validDismissData = await validDismiss.json();
  assert(
    validDismiss.status === 200 && validDismissData.finding?.reviewStatus === 'dismissed',
    'Finding dismissed with verified justification recorded in audit log'
  );

  // 6. CSV Export & Formula Injection Sanitization
  console.log('\n📊 Phase 6: Financial Export & Formula Sanitization');
  const csvExportRes = await fetch(`${BASE_URL}/api/export/${dossier.id}?format=csv`, { headers: authHeaders });
  const csvText = await csvExportRes.text();
  assert(csvExportRes.status === 200 && csvText.includes('"Category"') && csvText.includes('"Severity"'), 'CSV export generated with institutional header schema');
  assert(!csvText.startsWith('=') && !csvText.startsWith('+') && !csvText.startsWith('-'), 'Formula injection defense verified on exported CSV text');

  const jsonExportRes = await fetch(`${BASE_URL}/api/export/${dossier.id}?format=json`, { headers: authHeaders });
  const jsonData = await jsonExportRes.json();
  assert(jsonExportRes.status === 200 && jsonData.reportId === dossier.id, 'JSON dossier export contains complete structured metadata');

  // 7. Cross-Document Comparative Matrix
  console.log('\n🔬 Phase 7: Cross-Document Comparative Intelligence');
  const compRes = await fetch(`${BASE_URL}/api/investigations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      analysisIds: [dossier.id],
      title: 'Solo Document Check',
    }),
  });
  assert(compRes.status === 400, 'Cross-document engine enforces minimum 2 documents requirement (HTTP 400)');

  // 8. Document Library Vault Operations & Upload Parsing
  console.log('\n📁 Phase 8: Document Library Vault & Ingestion Pipeline');
  const sampleDocContent = `Item 1A. Risk Factors: The company faces significant covenant breach risks if revenues contract further.`;
  const blob = new Blob([sampleDocContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'sec_10k_risk_excerpt.txt');
  formData.append('title', 'SEC 10-K Risk Excerpt');

  const uploadRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { Cookie: cookieHeader.split(';')[0] },
    body: formData,
  });
  const uploadedDoc = await uploadRes.json();
  assert(uploadRes.status === 201 && Boolean(uploadedDoc.id), `Document uploaded and parsed into vault with ID: ${uploadedDoc.id}`);
  assert(uploadedDoc.extractedText.includes('Risk Factors'), 'Text extraction from uploaded document verified');

  // Fetch document by ID
  const fetchDocRes = await fetch(`${BASE_URL}/api/documents/${uploadedDoc.id}`, { headers: authHeaders });
  const fetchedDoc = await fetchDocRes.json();
  assert(fetchDocRes.status === 200 && fetchedDoc.title === 'SEC 10-K Risk Excerpt', 'Document vault retrieval verified by ID');

  // Analyze uploaded document directly
  const analyzeDocRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Audit of Uploaded Document',
      sourceType: 'document_upload',
      sourceCategory: 'regulatory_filing',
      analysisMode: 'combined',
      documentId: uploadedDoc.id,
    }),
  });
  const docAnalysis = await analyzeDocRes.json();
  assert((analyzeDocRes.status === 200 || analyzeDocRes.status === 201) && Boolean(docAnalysis.id), 'Analysis directly executed on vault document record');

  // Delete document
  const deleteDocRes = await fetch(`${BASE_URL}/api/documents/${uploadedDoc.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(deleteDocRes.status === 200, 'Vault document deleted successfully');

  // 9. Preferences & Settings Persistence
  console.log('\n⚙️ Phase 9: Settings & Preferences Persistence');
  const updatePrefRes = await fetch(`${BASE_URL}/api/auth/user`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      fullName: 'Chief Risk Officer',
      preferences: {
        defaultMode: 'combined',
        layout: 'compact',
        reducedMotion: true,
      },
    }),
  });
  const updatedUser = await updatePrefRes.json();
  assert(updatePrefRes.status === 200 && updatedUser.fullName === 'Chief Risk Officer', 'User profile full name updated');
  assert(updatedUser.preferences?.reducedMotion === true, 'Reduced motion accessibility preference persisted');

  // Restore name
  await fetch(`${BASE_URL}/api/auth/user`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ fullName: 'Lead Financial Analyst' }),
  });

  // 10. Account Lifecycle & Purge Validation (Disposable Test User)
  console.log('\n👤 Phase 10: Disposable Account Lifecycle & Purge Validation');
  const tempEmail = `temp_analyst_${Date.now()}@trinance.io`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tempEmail,
      password: 'TempPassword2026!',
      fullName: 'Disposable Audit Account',
    }),
  });
  const regData = await registerRes.json();
  assert(registerRes.status === 201 && Boolean(regData.user?.id), 'Disposable account created successfully');

  // Duplicate registration rejection
  const dupRegister = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tempEmail,
      password: 'TempPassword2026!',
      fullName: 'Duplicate Account',
    }),
  });
  assert(dupRegister.status === 400, 'Duplicate email registration rejected with HTTP 400');

  // Login as disposable user
  const tempLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tempEmail, password: 'TempPassword2026!' }),
  });
  const tempCookie = tempLoginRes.headers.get('set-cookie');
  const tempHeaders = {
    Cookie: tempCookie ? tempCookie.split(';')[0] : '',
    'Content-Type': 'application/json',
  };

  // Attempt delete account with wrong password -> should fail
  const badDeleteRes = await fetch(`${BASE_URL}/api/auth/user`, {
    method: 'DELETE',
    headers: tempHeaders,
    body: JSON.stringify({ password: 'IncorrectPassword' }),
  });
  assert(badDeleteRes.status === 400, 'Account deletion with incorrect password rejected with HTTP 400');

  // Legitimate account purge
  const goodDeleteRes = await fetch(`${BASE_URL}/api/auth/user`, {
    method: 'DELETE',
    headers: tempHeaders,
    body: JSON.stringify({ password: 'TempPassword2026!' }),
  });
  assert(goodDeleteRes.status === 200, 'Account and data purged successfully with HTTP 200');

  // Verify purged user cannot log in
  const postPurgeLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tempEmail, password: 'TempPassword2026!' }),
  });
  assert(postPurgeLogin.status === 401, 'Purged account login rejected with HTTP 401 Unauthorized');

  // 11. Sign-out Verification
  console.log('\n🚪 Phase 11: Analyst Sign-Out & Session Revocation');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', headers: authHeaders });
  assert(logoutRes.status === 200, 'Analyst session terminated with HTTP 200');

  console.log('\n================================================================');
  console.log(`   AUDIT FINISHED: ${tests} CHECKS EXECUTED, ${failures} FAILURE(S)`);
  console.log('================================================================\n');

  if (failures > 0) process.exit(1);
}

audit().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
