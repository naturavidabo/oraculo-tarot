const { spawnSync } = require('node:child_process');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const projects = ['tsconfig.app.json', 'tsconfig.node.json'];

for (const project of projects) {
  const result = spawnSync(
    npx,
    ['--no-install', 'tsc', '-p', project, '--pretty', 'false'],
    { stdio: 'inherit' },
  );

  if (result.error) {
    console.error(`✗ No se pudo ejecutar TypeScript CLI para ${project}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('✓ TypeScript validado mediante la CLI de TypeScript 7');
