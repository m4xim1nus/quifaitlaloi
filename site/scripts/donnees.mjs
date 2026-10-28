// Copie l'instantané versionné (data/qfl.sqlite, data/export/) dans static/donnees/, servi tel
// quel par la page « Données ». Lancé avant `dev` et `build` (package.json).
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(import.meta.dirname, '../..');
const cible = resolve(import.meta.dirname, '../static/donnees');
rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });
const exportDir = resolve(racine, 'data/export');
for (const f of readdirSync(exportDir)) cpSync(resolve(exportDir, f), resolve(cible, f));
cpSync(resolve(racine, 'data/qfl.sqlite'), resolve(cible, 'qfl.sqlite'));
console.log(`donnees : ${readdirSync(cible).length} fichiers copiés dans static/donnees/`);
