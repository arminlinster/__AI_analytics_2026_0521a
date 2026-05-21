import fs from 'fs';

const redirectsContent = `/api/analyze    /.netlify/functions/analyze    200
/api/health     /.netlify/functions/health     200
/*              /index.html                     200
`;

try {
  fs.writeFileSync('dist/_redirects', redirectsContent);
  console.log('Successfully generated dist/_redirects with API and SPA routing rules.');
} catch (err) {
  console.error('Failed to generate dist/_redirects:', err);
}
