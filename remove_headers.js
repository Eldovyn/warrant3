const fs = require('fs');

const files = [
  'src/routes/+page.svelte',
  'src/routes/mint/+page.svelte',
  'src/routes/my-warranties/+page.svelte',
  'src/routes/verify/+page.svelte'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Remove the <header class="navbar"> block
  const headerRegex = /<!-- ── Navbar ── -->[\s\S]*?<\/header>\n*|<!-- Navbar -->[\s\S]*?<\/header>\n*/g;
  content = content.replace(headerRegex, '');

  // Remove .navbar related styles
  const styleRegex = /\/\* ── Navbar ── \*\/[\s\S]*?(?=\/\* ── |\.brand |\.page-main |\/\* ── Page layout ── \*\/)/g;
  // Let's use a simpler approach: just leave the CSS for now if it's too complex, or remove specific known blocks.
  // Actually, unused CSS is fine temporarily, but we can try to strip it.
  
  fs.writeFileSync(file, content);
  console.log(`Processed ${file}`);
});
