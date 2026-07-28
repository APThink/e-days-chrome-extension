import { existsSync, copyFileSync } from 'node:fs';

if (!existsSync('src/config.js')) {
  copyFileSync('src/config.example.js', 'src/config.js');
}
