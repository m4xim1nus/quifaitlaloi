// Récits des textes emblématiques (cycle Fiches) : un fichier recits/<loi>.md par loi, écrit à
// la main et versionné. Frontmatter (loi, titre, statut, section, accroche, chapo), puis une
// section par date (« ## AAAA-MM-JJ »), intercalée dans le parcours de la loi. Chaque récit
// est aussi un « zoom » inséré dans le fil de sa législature, à la question `section`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { enLigne, paragraphes } from '$lib/markdown';

export const RECITS = resolve(process.cwd(), '../recits');

export interface EtapeRecit {
  date: string;
  html: string;
}

export type SectionZoom = 'chemins' | 'coalitions' | 'decisifs';
const SECTIONS: SectionZoom[] = ['chemins', 'coalitions', 'decisifs'];

export interface Recit {
  loi: string;
  titre: string;
  /** brouillon : écrit, pas encore relu par Max. */
  statut: 'brouillon' | 'relu';
  /** Question de la page de législature où le zoom s'insère. */
  section: SectionZoom;
  /** Une phrase pour le zoom (HTML). */
  accroche: string;
  chapo: string;
  etapes: EtapeRecit[];
}

function lire(fichier: string): Recit {
  const texte = readFileSync(resolve(RECITS, fichier), 'utf8');
  const m = texte.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${fichier} : frontmatter manquant`);
  const meta = Object.fromEntries(
    m[1].split('\n').map((l) => {
      const i = l.indexOf(':');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
  );
  const etapes = m[2]
    .split(/^## /m)
    .slice(1)
    .map((bloc) => {
      const [tete, ...corps] = bloc.split('\n');
      const date = tete.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`${fichier} : date invalide « ${date} »`);
      return { date, html: paragraphes(corps.join('\n')) };
    });
  for (const k of ['loi', 'titre', 'statut', 'section', 'accroche', 'chapo'])
    if (!meta[k]) throw new Error(`${fichier} : champ « ${k} » manquant`);
  if (!SECTIONS.includes(meta.section as SectionZoom))
    throw new Error(`${fichier} : section « ${meta.section} » inconnue`);
  return {
    loi: meta.loi,
    titre: meta.titre,
    statut: meta.statut === 'relu' ? 'relu' : 'brouillon',
    section: meta.section as SectionZoom,
    accroche: enLigne(meta.accroche),
    chapo: paragraphes(meta.chapo),
    etapes
  };
}

let cache: Recit[] | null = null;

/** Tous les récits, dans l'ordre des fichiers. */
export function recits(): Recit[] {
  if (cache) return cache;
  cache = existsSync(RECITS)
    ? readdirSync(RECITS)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
        .sort()
        .map(lire)
    : [];
  return cache;
}

export const recit = (loi: string) => recits().find((r) => r.loi === loi) ?? null;

export interface Zoom {
  loi: string;
  titre: string;
  accroche: string;
  section: SectionZoom;
  statut: Recit['statut'];
}

/** Les zooms d'une législature (lois dont l'adoption définitive y tombe). */
export function zooms(
  legislatureDe: (loi: string) => number | undefined,
  legislature: number
): Zoom[] {
  return recits()
    .filter((r) => legislatureDe(r.loi) === legislature)
    .map(({ loi, titre, accroche, section, statut }) => ({
      loi,
      titre,
      accroche,
      section,
      statut
    }));
}
