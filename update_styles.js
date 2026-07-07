const fs = require('fs');
const files = [
  'src/routes/mint/+page.svelte',
  'src/routes/my-warranties/+page.svelte',
  'src/routes/verify/+page.svelte'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/#0A0A0A/gi, '#12141e');
  content = content.replace(/#0D0D0D/gi, '#12141e');
  content = content.replace(/#171717/gi, '#12141e');
  content = content.replace(/#262626/gi, '#64748B');
  content = content.replace(/rgba\(10,\s*10,\s*10,\s*0\.85\)/g, 'rgba(18, 20, 30, 0.85)');
  content = content.replace(/rgba\(100,\s*116,\s*139,\s*0\.15\)/g, 'rgba(100, 116, 139, 0.3)');
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
