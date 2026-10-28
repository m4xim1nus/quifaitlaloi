// Phrases en clair d'une fiche de loi, construites seulement à partir des données (aucun
// jugement) : qui a voté quoi au scrutin décisif, et quel groupe a fait la différence.
import type { PositionGroupe, ScrutinDetaille } from './types';

/** « A », « A et B », « A, B et C ». */
export function enumeration(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/** « le groupe RN », « les groupes SOC et LIOT ». */
export const groupes = (sigles: string[]) =>
  `${sigles.length > 1 ? 'les groupes' : 'le groupe'} ${enumeration(sigles)}`;

/** Groupes du camp gagnant ou perdant, regroupés par position. */
export function parPosition(positions: PositionGroupe[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const p of positions) {
    if (p.position === 'absent') continue;
    m.set(p.position, [...(m.get(p.position) ?? []), p.sigle]);
  }
  return m;
}

/**
 * Phrases du scrutin décisif : positions des groupes, puis pivots hors socle. Sur un 49.3, le
 * scrutin décisif est la motion de censure (METHODO §7 : seuls les « pour » sont recueillis).
 */
export function phrasesScrutin(s: ScrutinDetaille): string[] {
  const g = parPosition(s.positions);
  const sig = s.signature;
  const out: string[] = [];
  if (s.objet === 'motion_censure') {
    const c = g.get('censure') ?? [];
    const pc = g.get('pas_censure') ?? [];
    out.push(
      `${c.length ? `${enumeration(c)} ${c.length > 1 ? 'ont' : 'a'} voté la censure` : 'Aucun groupe n’a voté la censure en majorité'}` +
        `${pc.length ? ` ; ${enumeration(pc)} ne l’${pc.length > 1 ? 'ont' : 'a'} pas votée.` : '.'}`
    );
    out.push(
      `La motion a recueilli ${s.pour} voix, il en fallait ${s.requis} : ${s.sort === 'rejete' ? 'elle est rejetée et le texte est considéré comme adopté' : 'elle est adoptée et le gouvernement tombe'}.`
    );
    const ph = sig?.pivots_hors_socle ?? [];
    if (ph.length)
      out.push(
        `Si ${groupes(ph)} ${ph.length > 1 ? 'avaient' : 'avait'} voté la censure en bloc, elle était adoptée.`
      );
    return out;
  }
  const morceaux: string[] = [];
  for (const [pos, verbe] of [
    ['pour', 'pour'],
    ['contre', 'contre'],
    ['abstention', 'abstention'],
    ['partage', 'partagés']
  ] as const) {
    const l = g.get(pos);
    if (l?.length) morceaux.push(`${verbe} : ${enumeration(l)}`);
  }
  if (morceaux.length) out.push(`${morceaux.join(' ; ')}.`.replace(/^./, (c) => c.toUpperCase()));
  if (s.objet === 'motion_rejet')
    out.push(
      `${s.pour} voix pour la motion, ${s.contre} contre : ${s.sort === 'adopte' ? 'la motion est adoptée, le texte est rejeté' : 'la motion est rejetée'}.`
    );
  else
    out.push(
      `${s.pour} voix pour, ${s.contre} contre${s.abstention ? `, ${s.abstention} abstentions` : ''} : ${s.sort === 'adopte' ? 'adopté' : 'rejeté'}.`
    );
  const objet = s.objet === 'motion_rejet' ? 'la motion' : 'le texte';
  if (sig) {
    if (sig.classe === 'consensus') out.push('Aucun groupe n’a voté contre.');
    const ph = sig.pivots_hors_socle;
    if (ph.length && s.sort === 'adopte')
      out.push(
        `Si ${groupes(ph)} ${ph.length > 1 ? 'avaient' : 'avait'} voté contre, ${objet} ${objet === 'la motion' ? 'était rejetée' : 'était rejeté'}.`
      );
    const pa = sig.pivots_abstention;
    if (pa.length && s.sort === 'adopte')
      out.push(
        `Si ${groupes(pa)} ${pa.length > 1 ? 'avaient' : 'avait'} voté contre au lieu de s’abstenir, ${objet} tombait.`
      );
  }
  return out;
}

const LECTURE: Record<string, string> = {
  premiere: 'en première lecture',
  deuxieme: 'en deuxième lecture',
  nouvelle: 'en nouvelle lecture',
  definitive: 'en lecture définitive',
  cmp: 'sur le texte de la commission mixte paritaire'
};

interface LectureRecit {
  chambre: 'AN' | 'SN';
  type_lecture: string;
  date: string | null;
  mode_adoption: string;
  issue: string;
  score_rejet_inverse: number | null;
}

/** Le parcours de la loi en deux ou trois phrases. */
export function phrasesChemin(
  loi: { date_adoption: string; chambre_finale: 'AN' | 'SN' | null; a_delai_expire: boolean },
  chemin: string,
  lectures: LectureRecit[],
  censures: { date: string; sort: string }[],
  dateLongue: (d: string | null) => string,
  libelleMode: (m: string) => string
): string[] {
  const out: string[] = [];
  const an = lectures.filter((l) => l.chambre === 'AN' && l.mode_adoption !== 'DELAI_EXPIRE');
  const derniere = an.at(-1);
  const ou = loi.chambre_finale === 'SN' ? 'au Sénat' : 'à l’Assemblée';
  out.push(
    `Adoptée définitivement le ${dateLongue(loi.date_adoption)} ${ou}, après ${lectures.length} lecture${lectures.length > 1 ? 's' : ''}.`
  );
  if (chemin === 'art_49_3') {
    const l493 = an.filter((l) => l.mode_adoption === 'ART_49_3' && l.issue !== 'rejete');
    if (l493.length)
      out.push(
        `Le Gouvernement a engagé sa responsabilité (49.3) ${enumeration(l493.map((l) => LECTURE[l.type_lecture]))} : le texte y est considéré comme adopté sans vote, aucune motion de censure n’ayant obtenu la majorité.`
      );
    const adoptees = censures.filter((c) => c.sort === 'adopte');
    for (const c of adoptees)
      out.push(
        `Le ${dateLongue(c.date)}, une motion de censure a été adoptée sur ce texte : le Gouvernement est tombé, et le texte a été repris par le suivant.`
      );
  } else if (chemin === 'rejet_inverse') {
    const r = an.find((l) => l.mode_adoption === 'REJET_INVERSE');
    if (r)
      out.push(
        `${LECTURE[r.type_lecture].replace(/^./, (c) => c.toUpperCase())}, l’Assemblée a adopté une motion de rejet préalable${r.score_rejet_inverse !== null ? ` : ${Math.round(r.score_rejet_inverse * 100)} % des voix pour la motion venaient de groupes qui ont ensuite voté le texte` : ''}. Le texte est allé directement en commission mixte paritaire.`
      );
    if (derniere)
      out.push(
        `L’Assemblée a ensuite adopté le texte de la commission mixte paritaire le ${dateLongue(derniere.date)}, par ${libelleMode(derniere.mode_adoption)}.`
      );
  } else if (derniere) {
    out.push(
      `Dernier passage à l’Assemblée ${LECTURE[derniere.type_lecture]}, le ${dateLongue(derniere.date)} : ${libelleMode(derniere.mode_adoption)}.`
    );
  }
  if (loi.a_delai_expire)
    out.push(
      'En première lecture, l’Assemblée n’a pas fini l’examen dans les délais fixés par la Constitution pour les textes budgétaires : le texte a été transmis au Sénat sans vote.'
    );
  return out;
}
