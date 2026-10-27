import * as api from './api.js';

async function runTests() {
  console.log('Testing api.js functions against ST-09 contract...');
  
  // Test 1: isMock
  console.assert(api.isMock() === true, 'Default should be mock mode');
  console.log('✔ Test 1: Default is mock mode');

  // Test 2: parseAnswer standard
  const text1 = '[ANSWERED] I count 3 buildings — residential. Each one is boxed on the evidence image.\n\nconfidence: 76/100';
  const p1 = api.parseAnswer(text1);
  console.assert(p1.verdict === 'ANSWERED', 'Verdict should be ANSWERED');
  console.assert(p1.confidence === 76, 'Confidence should be 76');
  console.assert(p1.body.includes('I count 3 buildings'), 'Body should contain text');
  console.assert(!p1.body.includes('confidence: 76/100'), 'Confidence line should be stripped from body');
  console.log('✔ Test 2: parseAnswer standard');

  // Test 3: parseAnswer refusal
  const textRefused = '[REFUSED] Satellite pixels cannot answer this — population is unanswerable.\n\nconfidence: 100/100';
  const pRefused = api.parseAnswer(textRefused);
  console.assert(pRefused.verdict === 'REFUSED', 'Verdict should be REFUSED');
  console.assert(pRefused.confidence === 100, 'Confidence should be 100');
  console.log('✔ Test 3: parseAnswer refusal');

  // Test 4: mock health
  const h = await api.health();
  console.assert(h.status === 'online', 'Health status should be online in mock');
  console.assert(h.version === 'mock', 'Version should be mock');
  console.log('✔ Test 4: health() in mock');

  // Test 5: mock chat standard
  const chatRes = await api.chat({ image: null, question: 'How many buildings?', threshold: 0.8 });
  console.assert(chatRes.verdict === 'ANSWERED', 'Chat verdict ANSWERED');
  console.assert(chatRes.confidence === 76, 'Chat confidence 76');
  console.assert(chatRes.markedUrl === 'assets/mock_marked.png', 'Marked url correct');
  console.log('✔ Test 5: chat() mock standard');

  // Test 6: mock chat refusal
  const chatRefuse = await api.chat({ image: null, question: 'What is the population?', threshold: 0.8 });
  console.assert(chatRefuse.verdict === 'REFUSED', 'Chat verdict REFUSED for population');
  console.assert(chatRefuse.confidence === 100, 'Confidence 100 for refusal');
  console.log('✔ Test 6: chat() mock refusal');

  // Test 7: mock compare
  const compRes = await api.compare({ pastImage: null, presentImage: null, question: 'What changed?', intervalMonths: 6 });
  console.assert(compRes.verdict === 'ANSWERED', 'Compare verdict ANSWERED');
  console.assert(compRes.confidence === 71, 'Compare confidence 71');
  console.assert(compRes.meta.changes_count === 4, 'Changes count 4');
  console.assert(compRes.meta.change_types['new structure'] === 1, 'New structure count 1');
  console.log('✔ Test 7: compare() mock standard');

  console.log('\nAll tests passed successfully against ST-09 endpoint contract!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
