import fs from 'fs';

try {
  fs.writeFileSync('dist/_redirects', '/* /index.html 200\n');
  console.log('Successfully generated dist/_redirects.');
} catch (err) {
  console.error('Failed to generate dist/_redirects:', err);
}
