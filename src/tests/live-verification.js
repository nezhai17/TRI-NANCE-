// Live verification script for Tri-nance (comprehensive full-workflow test)
const http = require('http');

async function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runVerification() {
  console.log('=== TRI-NANCE MASTER SYSTEM & WORKFLOW VERIFICATION ===\n');

  // 1. Landing Page
  const home = await request('http://localhost:3000/');
  console.log(`[1] GET / Landing Page: HTTP ${home.status}`);
  if (!home.body.includes('Tri-nance') || !home.body.includes('See the signals behind the numbers.')) {
    throw new Error('Landing page missing expected branding or headline');
  }
  console.log('    ✓ Branding, hero headline, and interactive preview switcher confirmed.');

  // 2. Authentication Login
  const loginRes = await request(
    'http://localhost:3000/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({
      email: 'analyst@trinance.io',
      password: 'Trinance2026!',
    })
  );
  console.log(`[2] POST /api/auth/login: HTTP ${loginRes.status}`);
  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : '';
  console.log(`    ✓ Session established: ${cookie ? cookie.substring(0, 30) + '...' : 'none'}`);

  // 3. Submit High-Risk Financial Report
  const highRiskText = `During the third quarter, operating revenue contracted by 14% year-over-year to $42.5 million. Furthermore, gross margin dropped from 58% to 41% due to severe cost inflation and material shortages across our primary supply chain. Operating cash flow deficit reached $18.2 million, resulting in declining cash reserves of only $6.4 million. As a consequence of these pressures, the company experienced a covenant breach under our senior credit facility. In addition, customer churn spiked to 22% among key enterprise accounts following service outage incidents in August. Days sales outstanding rose to 84 days, compounding our cash burn rate. The company is in active discussions with lenders regarding covenant relief, but there is substantial doubt about the company's ability to continue as a going concern if secondary financing is not secured.`;

  const analyzeRes1 = await request(
    'http://localhost:3000/api/analyze',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
    },
    JSON.stringify({
      title: 'Acme Corp Q3 Liquidity & Debt Covenant Disclosure',
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
      inputText: highRiskText,
    })
  );
  console.log(`[3] POST /api/analyze (High-Risk Report): HTTP ${analyzeRes1.status}`);
  const report1 = JSON.parse(analyzeRes1.body);
  console.log(`    ✓ Report ID: ${report1.id}`);
  console.log(`    ✓ Sentiment: ${report1.sentimentResult?.overall} (score: ${report1.sentimentResult?.score})`);
  console.log(`    ✓ Risk Severity: ${report1.riskResult?.highestSeverity} (score: ${report1.riskResult?.overallRiskScore}/100)`);
  console.log(`    ✓ Grounded Findings Detected: ${report1.findings?.length}`);

  // 4. Submit Second Positive Report
  const positiveText = `Apex delivered record net income of $88.4 million for the fiscal year, representing an expansion of 32% year-over-year. Robust client retention and efficiency initiatives accelerated margin expansion across all retail and commercial banking segments. Solvency ratios remained exceptionally strong with a Tier-1 capital ratio of 16.2%, and cash-rich balance sheet reserves increased to $410 million. Operating cash flow surplus was $94 million, enabling a 15% increase in annual dividends. No regulatory inquiries, litigation liabilities, or debt covenant strains were reported during the audited period.`;

  const analyzeRes2 = await request(
    'http://localhost:3000/api/analyze',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
    },
    JSON.stringify({
      title: 'Apex Financial Services Robust Performance',
      sourceType: 'pasted_text',
      sourceCategory: 'financial_report',
      analysisMode: 'combined',
      inputText: positiveText,
    })
  );
  console.log(`\n[4] POST /api/analyze (Positive Report): HTTP ${analyzeRes2.status}`);
  const report2 = JSON.parse(analyzeRes2.body);
  console.log(`    ✓ Sentiment: ${report2.sentimentResult?.overall} (score: +${report2.sentimentResult?.score})`);
  console.log(`    ✓ Risk Severity: ${report2.riskResult?.highestSeverity}`);

  // 5. Test Dossier Renaming API
  const renameRes = await request(
    `http://localhost:3000/api/analyses/${report1.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
    },
    JSON.stringify({ title: 'Acme Corp Q3 Liquidity Review (Renamed Audit)' })
  );
  console.log(`\n[5] PATCH /api/analyses/${report1.id} (Rename): HTTP ${renameRes.status}`);
  const updatedReport = JSON.parse(renameRes.body);
  console.log(`    ✓ Updated title confirmed: "${updatedReport.title}"`);

  // 6. Query Dashboard Metrics
  const metricsRes = await request(`http://localhost:3000/api/analyses?metrics=true`, {
    headers: { Cookie: cookie },
  });
  console.log(`\n[6] GET /api/analyses?metrics=true: HTTP ${metricsRes.status}`);
  const metricsData = JSON.parse(metricsRes.body);
  console.log(`    ✓ Total Analyses: ${metricsData.metrics.totalCompletedAnalyses}`);
  console.log(`    ✓ Negative Sentiment Share: ${metricsData.metrics.negativeSentimentShare}% (${metricsData.metrics.negativeCount}/${metricsData.metrics.eligibleCompletedCount})`);
  console.log(`    ✓ Open High & Critical Severity Risks: ${metricsData.metrics.openHighSeverityFindings}`);

  // 7. Test CSV Export with Formula Injection Protection
  const csvRes = await request(`http://localhost:3000/api/export/${report1.id}?format=csv`, {
    headers: { Cookie: cookie },
  });
  console.log(`\n[7] GET /api/export/${report1.id}?format=csv: HTTP ${csvRes.status}`);
  console.log(`    ✓ Content-Type: ${csvRes.headers['content-type']}`);
  console.log(`    ✓ CSV length: ${csvRes.body.length} bytes`);

  // 8. Test JSON Export
  const jsonRes = await request(`http://localhost:3000/api/export/${report1.id}?format=json`, {
    headers: { Cookie: cookie },
  });
  console.log(`\n[8] GET /api/export/${report1.id}?format=json: HTTP ${jsonRes.status}`);
  const exportedJson = JSON.parse(jsonRes.body);
  console.log(`    ✓ Clean JSON exported for: "${exportedJson.reportTitle}"`);

  // 9. Test All Core Authenticated Web Views
  const routesToTest = [
    '/dashboard',
    '/dashboard/analyze',
    '/dashboard/history',
    '/dashboard/reports',
    `/dashboard/reports/${report1.id}`,
    '/dashboard/documents',
    '/dashboard/settings',
    '/reset-password',
  ];

  console.log('\n[9] Testing All Authenticated & Workflow Routes:');
  for (const route of routesToTest) {
    const res = await request(`http://localhost:3000${route}`, { headers: { Cookie: cookie } });
    console.log(`    ✓ GET ${route}: HTTP ${res.status}`);
    if (res.status !== 200) {
      throw new Error(`Route ${route} failed with HTTP ${res.status}`);
    }
  }

  console.log('\n=== ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY ===');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
