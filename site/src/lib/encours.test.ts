import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { csvParse } from 'd3-dsv';
import { describe, expect, it } from 'vitest';
import {
  chapoEnCours,
  coalitionDernierVote,
  libelleAttente,
  libelleDernierVote,
  libelleSeance,
  natureTexte,
  parSection,
  section
} from './encours';
import { dateLongue } from './format';
import type { TexteEnCours } from './types';

type T = Parameters<typeof parSection>[0][number];
const texte = (o: Partial<T> = {}): T => ({
  id: 'X',
  attente: 'lecture',
  attente_chambre: 'SN',
  attente_type_lecture: 'premiere',
  seance_prevue: null,
  issue_derniere_lecture: 'adopte',
  chambre_finale: 'AN',
  date_derniere_lecture: '2026-07-07',
  ...o
});

describe('état d’un texte en cours', () => {
  it('dit ce que le texte attend, sans date supposée', () => {
    expect(libelleAttente(texte())).toBe('En attente de la 1re lecture au Sénat');
    expect(
      libelleAttente(
        texte({ attente: 'lecture', attente_chambre: 'AN', attente_type_lecture: 'deuxieme' })
      )
    ).toBe('En attente de la 2e lecture à l’Assemblée');
    // casseurs-payeurs : voté au Sénat, étape suivante pas encore ouverte à l'AN
    expect(
      libelleAttente(
        texte({ attente: 'transmis', attente_chambre: 'AN', attente_type_lecture: null })
      )
    ).toBe('Transmis à l’Assemblée');
    expect(libelleAttente(texte({ attente: 'cmp', attente_chambre: 'CMP' }))).toBe(
      'Commission mixte paritaire convoquée'
    );
    expect(
      libelleAttente(
        texte({
          attente: 'navette',
          attente_chambre: null,
          issue_derniere_lecture: 'rejete',
          chambre_finale: 'SN'
        })
      )
    ).toBe('Rejeté par le Sénat, suite de la navette pas encore enregistrée');
  });

  it('annonce une séance seulement si elle est inscrite', () => {
    expect(libelleSeance({ seance_prevue: null }, dateLongue)).toBeNull();
    expect(libelleSeance({ seance_prevue: '2026-11-19' }, dateLongue)).toBe(
      'Séance prévue le 19 novembre 2026'
    );
  });

  it('range les textes : séance inscrite d’abord, puis par chambre où ils attendent', () => {
    expect(section(texte({ seance_prevue: '2026-11-19' }))).toBe('seance');
    expect(section(texte())).toBe('SN');
    expect(section(texte({ attente: 'transmis', attente_chambre: 'AN' }))).toBe('AN');
    expect(section(texte({ attente: 'cmp_conclusions', attente_chambre: null }))).toBe('CMP');
    expect(section(texte({ attente: 'navette', attente_chambre: null }))).toBe('navette');
    const g = parSection([
      texte({ id: 'a', date_derniere_lecture: '2026-01-01' }),
      texte({ id: 'b', date_derniere_lecture: '2026-10-01' }),
      texte({ id: 'c', seance_prevue: '2026-11-19' }),
      texte({ id: 'd', seance_prevue: '2026-11-05' })
    ]);
    expect(g.map((x) => [x.section, x.textes.map((t) => t.id)])).toEqual([
      ['seance', ['d', 'c']],
      ['SN', ['b', 'a']]
    ]);
  });

  it('nomme le dernier vote et sa coalition, seulement pour une adoption nominative', () => {
    const base = {
      issue_derniere_lecture: 'adopte' as const,
      chambre_finale: 'SN' as const,
      classe_an: null,
      classe_sn: 'socle_rn' as const,
      pivots_hors_socle_an: [],
      pivots_hors_socle_sn: [],
      mode_final: 'SCRUTIN_PUBLIC' as const
    };
    expect(libelleDernierVote(base)).toBe('Adopté par le Sénat');
    expect(coalitionDernierVote(base)).toEqual({ classe: 'socle_rn', pivots: [] });
    expect(coalitionDernierVote({ ...base, mode_final: 'MAIN_LEVEE' })).toBeNull();
    expect(coalitionDernierVote({ ...base, issue_derniere_lecture: 'rejete' })).toBeNull();
  });

  it('ne dit jamais « loi » seul pour un texte en cours', () => {
    expect(natureTexte({ initiative: 'proposition', type: 'ordinaire', sous_type: null })).toBe(
      'Proposition de loi'
    );
    expect(natureTexte({ initiative: 'projet', type: 'financement_ss', sous_type: 'LFSS' })).toBe(
      'Projet de loi de financement de la Sécurité sociale'
    );
    expect(natureTexte({ initiative: 'projet', type: 'finances', sous_type: 'reglement' })).toBe(
      'Projet de loi d’approbation des comptes'
    );
  });

  it('génère le chapô depuis les données', () => {
    expect(chapoEnCours(2, '2026-10-28', dateLongue)).toMatch(
      /^Au 28 octobre 2026, 2 textes déjà votés .* attendent .* Ce ne sont pas des lois/
    );
    expect(chapoEnCours(1, '2026-10-28', dateLongue)).toMatch(/1 texte déjà voté .* attend la/);
  });
});

// Contrôle croisé avec le pipeline : les textes en cours ne sont jamais des lois.
const EXPORT = resolve(import.meta.dirname, '../../../data/export');
const lire = (f: string) => csvParse(readFileSync(resolve(EXPORT, f), 'utf8'));

describe('textes en cours (données réelles)', () => {
  const enCours = lire('en_cours.csv') as unknown as Record<keyof TexteEnCours, string>[];
  const lois = lire('lois.csv');

  it('aucun texte en cours n’est une loi', () => {
    const dossiers = new Set(lois.map((l) => l.dossier_an));
    expect(enCours.filter((t) => dossiers.has(t.id))).toEqual([]);
  });

  it('les témoins de Max sont en cours', () => {
    const r = Object.fromEntries(
      enCours.filter((t) => !t.motif_ecart).map((t) => [t.id, `${t.attente} ${t.attente_chambre}`])
    );
    expect(r.DLR5L17N54925).toBe('transmis AN'); // casseurs-payeurs, voté au Sénat le 27/10/2026
    expect(r.DLR5L17N51037).toBe('lecture SN'); // légitime défense, voté à l'AN le 07/07/2026
  });

  it('chaque texte en cours a une lecture votée', () => {
    const votes = new Set(
      lire('en_cours_lectures.csv')
        .filter((l) => l.issue === 'adopte' || l.issue === 'rejete')
        .map((l) => l.texte_id)
    );
    expect(enCours.filter((t) => !votes.has(t.id)).map((t) => t.id)).toEqual([]);
  });
});
