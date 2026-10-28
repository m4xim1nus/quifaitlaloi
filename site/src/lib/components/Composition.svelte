<script lang="ts">
  // Coalitions de la période (docs/CONCEPTION.md §9) : une rangée par coalition, dans un ordre
  // fixe. La définition se lit dans la grille de présence (quels blocs sont dans le camp
  // gagnant), l'effectif dans la rangée de carrés (un carré = une loi, une seule échelle). Les
  // lois s'affichent en dépliant la rangée.
  import { comptesCoalitions } from '$lib/agregats';
  import { CLASSES, LIBELLE_CHEMIN, LIBELLE_CLASSE } from '$lib/libelles';
  import { dateCourte } from '$lib/format';
  import type { LoiResume } from '$lib/server/vues';
  import { legislature } from '$lib/legislatures';
  import type { Classe } from '$lib/types';

  interface Props {
    lois: LoiResume[];
    conventions: boolean;
    legislature: number;
    /** Ce que recouvre chaque coalition, en une phrase (legislatures.ts). */
    resumes?: Partial<Record<Classe | 'aucune', string>>;
  }
  let { lois, conventions, legislature: numLeg, resumes = {} }: Props = $props();

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

  const MAX = 10;
  /** Texte marquant : voté en scrutin solennel (choisi par la Conférence des présidents pour les
   * textes importants), ou passé au 49.3 ou par le rejet de ses partisans. */
  const marquante = (l: LoiResume) =>
    l.solennel || l.chemin === 'art_49_3' || l.chemin === 'rejet_inverse';
  /** À défaut de résumé écrit : les thèmes du Sénat les plus fréquents de la coalition. */
  function themesDe(ls: LoiResume[]): string[] {
    const n = new Map<string, number>();
    for (const l of ls)
      for (const t of l.themes) if (t !== 'Société') n.set(t, (n.get(t) ?? 0) + 1);
    return [...n]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t.toLowerCase());
  }
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
  const lien = (k: Ligne) =>
    `/lois?legislature=${numLeg}&coalition=${k}${conventions ? '&conventions=1' : ''}`;
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
          {@const fortes = ls.filter(marquante)}
          {@const montrees = [
            ...fortes.filter((l) => l.chemin !== 'nominatif'),
            ...fortes.filter((l) => l.chemin === 'nominatif'),
            ...ls.filter((l) => !marquante(l))
          ].slice(0, MAX)}
          <div class="detail" id="coalition-{k}">
            {#if resumes[k]}
              <p class="resume">{resumes[k]}</p>
            {:else if themesDe(ls).length}
              <p class="resume">Surtout&#8239;: {themesDe(ls).join(', ')}.</p>
            {/if}
            <ul class="etiquettes-lois">
              {#each montrees as l (l.id)}
                <li>
                  <a class="etiquette-loi" class:forte={marquante(l)} href="/lois/{l.id}"
                    >{l.titre_court}<span class="annee chiffres">{l.date_adoption.slice(0, 4)}</span
                    ></a
                  >
                </li>
              {/each}
            </ul>
            <p class="petit">
              {#if fortes.length}<span class="secondaire"
                  >En grand&#8239;: vote solennel ou 49.3.
                </span>{/if}<a class="tout" href={lien(k)}>Voir les {n} lois dans l’explorateur</a>
            </p>
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  <p class="note petit secondaire">
    ● vote pour · ○ ne vote pas contre. Socle&#8239;: {legislature(numLeg).socleDeveloppe}.
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
  .resume {
    margin: 0;
    max-width: 62ch;
  }
  .etiquettes-lois {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .etiquettes-lois li {
    display: block;
    padding: 0;
    border: none;
  }
  .etiquette-loi {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 10px;
    border: 1px solid var(--filet);
    border-radius: var(--rayon);
    color: var(--encre);
    text-decoration: none;
    font-size: 0.875rem;
    line-height: 1.35;
  }
  .etiquette-loi.forte {
    font-family: var(--serif);
    font-size: 1.0625rem;
    border-color: var(--ardoise);
  }
  .etiquette-loi:hover {
    border-color: var(--encre);
    text-decoration: underline;
  }
  .etiquette-loi .annee {
    font-family: var(--sans);
    font-size: 0.75rem;
    color: var(--ardoise);
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
