<script lang="ts">
  // Parcours d'une loi : les lectures dans l'ordre, chacune avec sa chambre, sa date, son mode
  // et son issue, entremêlées des événements de procédure (49.3, censure, CMP, Conseil
  // constitutionnel, promulgation).
  import { LIBELLE_CHAMBRE, LIBELLE_LECTURE, LIBELLE_MODE } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import { lienScrutin, numeroScrutin } from '$lib/liens';
  import type { Evenement, Lecture, ScrutinDetaille } from '$lib/types';

  interface Props {
    lectures: (Lecture & { scrutin: ScrutinDetaille | null })[];
    evenements: Evenement[];
  }
  let { lectures, evenements }: Props = $props();

  const CONTOURNEMENT = new Set(['ART_49_3', 'REJET_INVERSE']);
  type Etape =
    | { genre: 'lecture'; date: string; lecture: Props['lectures'][number] }
    | { genre: 'evenement'; date: string; texte: string; lien?: string };

  function texteEvenement(e: Evenement): { texte: string; lien?: string } | null {
    switch (e.type) {
      case 'cmp_convoquee':
        return { texte: 'Commission mixte paritaire convoquée' };
      case 'cmp_accord':
        return { texte: 'Accord en commission mixte paritaire' };
      case 'cmp_desaccord':
        return { texte: 'Désaccord en commission mixte paritaire' };
      case 'engagement_49_3':
        return { texte: 'Le Gouvernement engage sa responsabilité (49.3)' };
      case 'saisine_cc':
        return { texte: `Saisine du Conseil constitutionnel (${e.detail ?? ''})` };
      case 'decision_cc': {
        const [sens, lien] = (e.detail ?? '').split(' | ');
        return { texte: `Décision du Conseil constitutionnel : ${sens.toLowerCase()}`, lien };
      }
      case 'promulgation':
        return { texte: `Promulgation de la loi n° ${e.detail}` };
      default:
        return null;
    }
  }

  const etapes = $derived.by(() => {
    const out: Etape[] = lectures.map((l) => ({
      genre: 'lecture',
      date: l.date ?? '',
      lecture: l
    }));
    const vus = new Set<string>();
    for (const e of evenements) {
      const t = texteEvenement(e);
      if (!t) continue;
      const cle = `${e.date}|${t.texte}`;
      if (vus.has(cle)) continue;
      vus.add(cle);
      out.push({ genre: 'evenement', date: e.date, ...t });
    }
    // À date égale, l'événement (engagement du 49.3, accord en CMP) précède la décision.
    return out.sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.genre === b.genre ? 0 : a.genre === 'evenement' ? -1 : 1)
    );
  });

  function issue(l: Props['lectures'][number]): string {
    if (l.mode_adoption === 'DELAI_EXPIRE')
      return 'pas de vote : le texte est transmis à l’expiration des délais';
    const s = l.scrutin;
    if (!s) return l.statut;
    const objet =
      s.objet === 'motion_censure'
        ? 'motion de censure'
        : s.objet === 'motion_rejet'
          ? 'motion de rejet'
          : null;
    const decompte = objet
      ? `${objet} ${s.sort === 'adopte' ? 'adoptée' : 'rejetée'} : ${s.pour} pour${s.objet === 'motion_censure' ? ` (${s.requis} requis)` : `, ${s.contre} contre`}`
      : `${s.pour} pour, ${s.contre} contre`;
    return `${l.statut} — ${decompte}`;
  }
</script>

<ol class="parcours">
  {#each etapes as e, i (i)}
    {#if e.genre === 'lecture'}
      {@const l = e.lecture}
      <li
        class="lecture {l.mode_adoption}"
        class:contournement={CONTOURNEMENT.has(l.mode_adoption)}
      >
        <span class="date petit">{dateLongue(l.date)}</span>
        <span class="chambre {l.chambre}">{LIBELLE_CHAMBRE[l.chambre]}</span>
        <span class="corps">
          <strong>{LIBELLE_LECTURE[l.type_lecture]}</strong>
          <span class="mode">{LIBELLE_MODE[l.mode_adoption]}</span>
          <span class="secondaire petit">
            {issue(l)}
            {#if l.scrutin && lienScrutin(l.scrutin.id)}
              <a href={lienScrutin(l.scrutin.id)} rel="external">{numeroScrutin(l.scrutin.id)}</a>
            {/if}
            {#if l.decision_deduite}(décision déduite de la date de séance){/if}
          </span>
        </span>
      </li>
    {:else}
      <li class="evenement">
        <span class="date petit">{dateLongue(e.date)}</span>
        <span class="point" aria-hidden="true"></span>
        <span class="corps petit">
          {#if e.lien}<a href={e.lien} rel="external">{e.texte}</a>{:else}{e.texte}{/if}
        </span>
      </li>
    {/if}
  {/each}
</ol>

<style>
  .parcours {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
  }
  li {
    display: grid;
    grid-template-columns: 9.5rem 5.5rem 1fr;
    gap: 4px 14px;
    align-items: baseline;
    padding: 8px 0;
    border-top: 1px solid var(--filet);
  }
  .evenement {
    padding: 4px 0;
    border-top: none;
    color: var(--ardoise);
  }
  .date {
    color: var(--ardoise);
    font-variant-numeric: tabular-nums;
  }
  .chambre {
    font-size: 0.8125rem;
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 8px;
    justify-self: start;
    border: 1px solid var(--encre);
  }
  .chambre.SN {
    background: var(--puce);
    border-color: var(--puce);
  }
  .point {
    justify-self: center;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--gris);
    align-self: center;
  }
  .corps {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    align-items: baseline;
  }
  .mode {
    font-weight: 700;
  }
  .contournement .mode {
    background: var(--puce);
    padding: 0 6px;
    border-radius: var(--rayon);
    box-shadow: inset 3px 0 0 var(--ch-art_49_3);
  }
  .REJET_INVERSE .mode {
    box-shadow: inset 3px 0 0 var(--ch-rejet_inverse);
  }
  @media (max-width: 640px) {
    li {
      grid-template-columns: auto 1fr;
    }
    .date {
      grid-column: 1 / -1;
    }
    .point {
      display: none;
    }
    .evenement .corps {
      grid-column: 1 / -1;
    }
  }
</style>
