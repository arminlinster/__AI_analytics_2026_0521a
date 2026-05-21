import fs from 'fs';

try {
  fs.rmSync('dist', { recursive: true, force: true });
  console.log('Successfully cleaned dist directory.');
} catch (err) {
  console.error('Failed to clean dist directory:', err);
}
