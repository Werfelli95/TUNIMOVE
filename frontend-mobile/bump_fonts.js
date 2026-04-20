const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Bump fontSize
      content = content.replace(/fontSize:\s*(\d+)/g, (match, p1) => {
        changed = true;
        const newSize = parseInt(p1) + 2; // Increase font size globally by 2 for RN
        return `fontSize: ${newSize}`;
      });
      
      // Make weights bolder
      content = content.replace(/fontWeight:\s*'(\d+)'/g, (match, p1) => {
        let weight = parseInt(p1);
        if (weight < 800) {
          changed = true;
          return `fontWeight: '${weight + 100}'`;
        }
        return match;
      });

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Upgraded typography in ' + fullPath);
      }
    }
  }
}

console.log('Starting typography upgrade...');
processDir('./app');
processDir('./components');
processDir('./constants');
console.log('Done.');
