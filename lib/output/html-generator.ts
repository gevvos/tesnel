import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { TesnelOutput } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const findTemplate = (): string => {
  const candidates = [
    resolve(__dirname, '../../dist/ui/index.html'),
    resolve(__dirname, '../dist/ui/index.html'),
    resolve(process.cwd(), 'dist/ui/index.html'),
  ];

  for (const path of candidates) {
    try {
      return readFileSync(path, 'utf8');
    } catch {}
  }

  throw new Error('UI template not found. Run `pnpm build:ui` first.');
};

export const generateHtml = (output: TesnelOutput, outputPath: string): void => {
  const template = findTemplate();

  const jsonData = JSON.stringify(output);
  const placeholder = `type="application/json">__TESNEL_DATA__</script>`;
  const replacement = `type="application/json">${jsonData}</script>`;
  const html = template.replace(placeholder, replacement);
  writeFileSync(outputPath, html);
};
