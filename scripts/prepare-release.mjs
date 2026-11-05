// Preserve the existing legacy GitHub Pages host configuration.
// Generate the public browser artifact from environment configuration, never from literals.
import { copyFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
const built=await readFile('dist/tracking-config.js','utf8');
if(!built.startsWith('// Generated public runtime configuration.')) throw new Error('Unexpected configuration artifact.');
if(/sb_secret_|phx_|service_role|password/i.test(built)) throw new Error('Privileged data must not be published.');
await copyFile('dist/tracking-config.js','tracking-config.js');
console.log('Prepared tracking-config.js as a versioned public deployment artifact for legacy Pages.');
