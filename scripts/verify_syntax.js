const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkDir(d) {
  let count = 0;
  const files = fs.readdirSync(d);
  files.forEach(f => {
    const full = path.join(d, f);
    if (fs.statSync(full).isDirectory()) {
      count += checkDir(full);
    } else if (f.endsWith('.js')) {
      execSync('node -c "' + full.replace(/\\/g, '/') + '"');
      count++;
    }
  });
  return count;
}

const c1 = checkDir('e:/RWA/RWA/public');
const c2 = checkDir('e:/RWA/prototype');
console.log(`Verified ${c1} files in RWA/public and ${c2} files in prototype. All syntax valid!`);

