const fs = require('fs');
const path = require('path');

const screensDir = 'e:/RWA/RWA/public/screens';
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));

console.log('=== AUDITING SCREENS IN ' + screensDir + ' ===');
files.forEach(f => {
  const content = fs.readFileSync(path.join(screensDir, f), 'utf8');
  const loaders = content.match(/Loading [^<"'\n]+/gi) || [];
  const dummyHints = [];
  if (content.includes('Ram Singh')) dummyHints.push('Ram Singh');
  if (content.includes('Emerald Heights')) dummyHints.push('Emerald Heights');
  if (content.includes('baseBudget =')) dummyHints.push('baseBudget');
  if (content.includes('generateDemoExpenses')) dummyHints.push('generateDemoExpenses');
  if (content.includes('31,600')) dummyHints.push('31,600');
  if (content.includes('42,500')) dummyHints.push('42,500');

  // Check how live loading is triggered
  const hasSetTimeout = content.includes('setTimeout');
  const hasLoadLive = /loadLive[A-Za-z0-9_]+/g.test(content);

  if (loaders.length > 0 || dummyHints.length > 0) {
    console.log(`\nFile: ${f}`);
    if (loaders.length) console.log('  Loaders:', [...new Set(loaders)]);
    if (dummyHints.length) console.log('  Dummy hints:', dummyHints);
  }
});

