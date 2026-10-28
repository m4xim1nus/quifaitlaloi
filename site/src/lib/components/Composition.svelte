<script lang="ts">
  // Coalitions de la période (docs/CONCEPTION.md §9) : une rangée par coalition, dans un ordre
  // fixe. La définition se lit dans la grille de présence (quels blocs sont dans le camp
  // gagnant), l'effectif dans la rangée de carrés (un carré = une loi, une seule échelle). Les
  // lois s'affichent en dépliant la rangée.
  import Themes from './Themes.svelte';
  import { comptesCoalitions } from '$lib/agregats';
  import { CLASSES, LIBELLE_CHEMIN, LIBELLE_CLASSE } from '$lib/libelles';
  import { dateCourte } from '$lib/format';
  import type { LoiResume } from '$lib/server/vues';
  import type { Classe } from '$lib/types';

  interface Props {
    lois: LoiResume[];
    conventions: boolean;
  }
  let { lois, conventions }: Props = $props();

  type Ligne = Classe | 'aucune';
  type Presence = 'oui' | 'non' | 'pas_contre' | 'inconnu';
  const BLOCS = ['Gauche', 'Socle', 'RN'] as const;

  /** Présence de la gauche, du socle et du RN dans le camp gagnant, par coalition. */
  const PRESENCE: Record<Ligne, [Presence, Presence, Presence]> = {
    consensus: ['pas_contre', 'oui', 'pas_contre'],
    transpartisan: ['oui', 'oui', 'oui'],
    socle_gauche: ['oui', 'oui', 'non'],
    socle_rn: ['non', 'oui', 'oui'],
    socle_seul: ['non', 'oui', 'non'],
    socle_droite: ['non', 'oui', 'non'],
    hors_socle: ['inconnu', 'non', 'inconnu'],
    aucune: ['inconnu', 'inconnu', 'inconnu']
  };
  const GLYPHE: Record<Presence, string> = { oui: '●', non: '·', pas_contre: '○', inconnu: '?' };
  const DIT: Record<Presence, string> = {
    oui: 'oui',
    non: 'non',
    pas_contre: 'pas contre',
    inconnu: 'inconnu'
  };

  const DEFINITION: Record<Ligne, string> = {
    consensus:
      'Aucun groupe de gauche, du socle ou du RN ne vote majoritairement contre. Des abstentions sont possibles, ainsi que des votes contre de LIOT ou de non-inscrits.',
    transpartisan:
      'Le socle, au moins un groupe de gauche et au moins un groupe du bloc RN votent pour ; d’autres groupes votent contre.',
    socle_gauche: 'Le socle et au moins un groupe de gauche votent pour ; aucun groupe du bloc RN.',
    socle_rn: 'Le socle et au moins un groupe du bloc RN votent pour ; aucun groupe de gauche.',
    socle_seul:
      'Le socle vote pour sans la gauche ni le RN (LIOT ou des non-inscrits peuvent l’appuyer).',
    socle_droite:
      'Lecture tenue avant la dissolution de juin 2024 : le centre et LR votent pour, sans la gauche ni le RN.',
    hors_socle: 'Le résultat est obtenu sans les voix du socle commun.',
    aucune:
      'Pas de vote nominatif au dernier passage à l’Assemblée : on ne sait pas qui a voté quoi. Ce n’est pas un consensus.'
  };

  const MAX = 8;
  const c = $derived(comptesCoalitions(lois));
  const loisDe = (k: Ligne) =>
    [...(k === 'aucune' ? c.sans : c.parClasse.get(k)!)].sort((a, b) =>
      b.date_adoption.localeCompare(a.date_adoption)
    );
  // Ordre fixe ; ne masquer que les rangées qui ne peuvent rien contenir ici.
  const lignes = $derived(
    ([...CLASSES, 'aucune'] as Ligne[]).filter(
      (k) => !['socle_droite', 'hors_socle', 'aucune'].includes(k) || loisDe(k).length > 0
    )
  );

  let ouvertes = $state<Record<string, boolean>>({});
  const lien = (k: Ligne) => `/lois?coalition=${k}${conventions ? '&conventions=1' : ''}`;
  const libelle = (k: Ligne) => (k === 'aucune' ? 'Sans vote nominatif' : LIBELLE_CLASSE[k]);
  const nomAccessible = (k: Ligne, n: number) =>
    `${libelle(k)}, ${n} loi${n > 1 ? 's' : ''}. ` +
    BLOCS.map((b, i) => `${b} : ${DIT[PRESENCE[k][i]]}`).join(', ');
</script>

<div class="coalitions">
  <div class="entete petit" aria-hidden="true">
    <span class="titre-colonnes">Dans le camp gagnant</span>
    <span class="glyphes">
      {#each BLOCS as b (b)}<span>{b}</span>{/each}
    </span>
  </div>

  <ul>
    {#each lignes as k (k)}
      {@const ls = loisDe(k)}
      {@const n = ls.length}
      {@const ouverte = !!ouvertes[k] && n > 0}
      <li class:a-part={k === 'aucune'} class:vide-ligne={n === 0}>
        <button
          type="button"
          class="rangee"
          aria-expanded={ouverte}
          aria-controls="coalition-{k}"
          aria-label={nomAccessible(k, n)}
          disabled={n === 0}
          onclick={() => (ouvertes = { ...ouvertes, [k]: !ouvertes[k] })}
        >
          <span class="chevron" aria-hidden="true">{ouverte ? '▾' : '▸'}</span>
          <span class="nom">{libelle(k)}</span>
          <span class="glyphes" aria-hidden="true">
            {#each PRESENCE[k] as p, i (i)}<span class="glyphe {p}">{GLYPHE[p]}</span>{/each}
          </span>
        </button>
        <span class="carres" aria-hidden="true">
          {#each ls as l (l.id)}
            <a
              href="/lois/{l.id}"
              tabindex="-1"
              class="carre"
              class:sans={k === 'aucune'}
              style:background={k === 'aucune' ? undefined : `var(--co-${k})`}
              title="{l.titre_court} · {dateCourte(l.date_adoption).slice(3)} · {LIBELLE_CHEMIN[
                l.chemin
              ]}"
            ></a>
          {/each}
        </span>
        <span class="nombre effectif">{n}</span>

        {#if ouverte}
          <div class="detail" id="coalition-{k}">
            <p class="petit secondaire">{DEFINITION[k]}</p>
            <ul class="lois">
              {#each ls.slice(0, MAX) as l (l.id)}
                <li>
                  <span
                    ><a href="/lois/{l.id}">{l.titre_court}</a> <Themes themes={l.themes} /></span
                  >
                  <span class="date petit chiffres">{dateCourte(l.date_adoption).slice(3)}</span>
                </li>
              {/each}
            </ul>
            {#if n > MAX}
              <a class="petit tout" href={lien(k)}>Voir les {n} lois dans l’explorateur</a>
            {/if}
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  <p class="note petit secondaire">
    ● au moins un groupe du bloc vote pour · ○ pour ou abstention, mais pas contre. Socle
    commun&#8239;: le centre (EPR, Les Démocrates, Horizons) et la Droite républicaine. Sur un 49.3,
    le camp gagnant est formé des groupes qui ne votent pas la censure. Cliquer une coalition pour
    voir ses lois.
  </p>
</div>

<style>
  .coalitions {
    --colonnes: minmax(11rem, 15rem) 10.5rem 1fr 3rem;
    display: grid;
    gap: 4px;
  }
  .entete {
    display: grid;
    grid-template-columns: var(--colonnes);
    gap: 12px;
    color: var(--ardoise);
    align-items: end;
  }
  .titre-colonnes {
    text-align: right;
  }
  .glyphes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    text-align: center;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    display: grid;
    grid-template-columns: var(--colonnes);
    gap: 4px 12px;
    align-items: center;
    padding: 6px 0;
    border-top: 1px solid var(--filet);
  }
  li.a-part {
    margin-top: 10px;
    border-top: 1px dashed var(--gris);
  }
  li.vide-ligne {
    opacity: 0.5;
  }
  .rangee {
    grid-column: 1 / 3;
    display: grid;
    grid-template-columns: 1rem 1fr 10.5rem;
    gap: 12px;
    align-items: center;
    text-align: left;
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
    font-weight: 700;
  }
  .rangee:disabled {
    cursor: default;
  }
  .rangee:hover:not(:disabled) .nom {
    text-decoration: underline;
  }
  .chevron {
    color: var(--ardoise);
  }
  .glyphe {
    font-size: 1rem;
    line-height: 1;
  }
  .glyphe.non,
  .glyphe.inconnu {
    color: var(--gris);
  }
  .carres {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .carre {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex: none;
  }
  .carre.sans {
    background: var(--papier);
    box-shadow: inset 0 0 0 1.5px var(--ardoise);
  }
  .carre:hover {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
  }
  .effectif {
    font-size: 1.5rem;
    line-height: 1;
    text-align: right;
  }
  .detail {
    grid-column: 1 / -1;
    padding: 4px 0 10px 1.75rem;
    display: grid;
    gap: 8px;
    max-width: 52rem;
  }
  .lois {
    display: grid;
    gap: 4px;
  }
  .lois li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 0;
    border: none;
    align-items: baseline;
  }
  .lois a {
    text-decoration: none;
  }
  .lois a:hover {
    text-decoration: underline;
  }
  .date {
    color: var(--ardoise);
    white-space: nowrap;
  }
  .tout {
    font-weight: 700;
  }
  .note {
    margin-top: 8px;
    max-width: var(--colonne);
  }
  @media (max-width: 640px) {
    .entete {
      display: none;
    }
    li {
      grid-template-columns: 1fr auto;
    }
    .rangee {
      grid-column: 1;
      grid-template-columns: 1rem 1fr;
    }
    .rangee .glyphes {
      grid-column: 2;
      display: flex;
      gap: 10px;
      font-weight: 400;
    }
    .rangee .glyphe::before {
      font-size: 0.75rem;
      color: var(--ardoise);
      margin-right: 3px;
    }
    .rangee .glyphe:nth-child(1)::before {
      content: 'Gauche';
    }
    .rangee .glyphe:nth-child(2)::before {
      content: 'Socle';
    }
    .rangee .glyphe:nth-child(3)::before {
      content: 'RN';
    }
    .carres {
      grid-column: 1 / -1;
      grid-row: 2;
    }
    .effectif {
      grid-column: 2;
      grid-row: 1;
    }
    .detail {
      padding-left: 0;
    }
  }
</style>
