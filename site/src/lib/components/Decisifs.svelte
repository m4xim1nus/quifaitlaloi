<script lang="ts">
  // Groupes décisifs hors socle (docs/CONCEPTION.md §14). En haut, une rangée par groupe (un
  // carré par loi) qui sert de filtre ; en dessous, une ligne par loi, une colonne par groupe :
  // chaque loi n'apparaît qu'une fois, avec tous ses groupes décisifs.
  import Themes from './Themes.svelte';
  import { dateCourte } from '$lib/format';
  import { LIBELLE_CHEMIN } from '$lib/libelles';
  import type { GroupeAffiche, LoiResume } from '$lib/server/vues';

  interface Props {
    lois: LoiResume[];
    groupes: GroupeAffiche[];
  }
  let { lois, groupes }: Props = $props();

  const APERCU = 10;
  const estVote = (l: LoiResume, g: string) => l.pivots.includes(g);
  const estAbst = (l: LoiResume, g: string) =>
    !estVote(l, g) && l.pivots_abst_hors_socle.includes(g);
  const decisif = (l: LoiResume, g: string) => estVote(l, g) || estAbst(l, g);

  const lignes = $derived(
    lois
      .filter((l) => l.pivots.length || l.pivots_abst_hors_socle.length)
      .sort((a, b) => b.date_adoption.localeCompare(a.date_adoption))
  );
  // Groupes de la XVIIe, puis ceux d'une lecture tenue sous la XVIe (LR, par exemple), en gris.
  const tous = $derived.by((): GroupeAffiche[] => {
    const connus = new Set(groupes.map((g) => g.sigle));
    const autres = [
      ...new Set(lignes.flatMap((l) => [...l.pivots, ...l.pivots_abst_hors_socle]))
    ].filter((s) => !connus.has(s));
    return [
      ...groupes,
      ...autres.map((sigle) => ({
        sigle,
        nom: `${sigle} (XVIe législature)`,
        bloc: 'autres' as const,
        couleur: null
      }))
    ];
  });
  const colonnes = $derived(
    tous
      .map((g) => {
        const ls = lignes
          .filter((l) => decisif(l, g.sigle))
          .sort((a, b) => Number(estAbst(a, g.sigle)) - Number(estAbst(b, g.sigle)));
        return {
          ...g,
          lois: ls,
          vote: ls.filter((l) => estVote(l, g.sigle)).length,
          abst: ls.filter((l) => estAbst(l, g.sigle)).length
        };
      })
      .filter((g) => g.lois.length > 0)
  );

  let choix = $state<string | null>(null);
  let tout = $state(false);
  const choisi = $derived(colonnes.find((g) => g.sigle === choix) ?? null);
  const filtrees = $derived(choisi ? lignes.filter((l) => decisif(l, choisi.sigle)) : lignes);
  const visibles = $derived(choisi || tout ? filtrees : filtrees.slice(0, APERCU));
  const couleur = (g: GroupeAffiche) => g.couleur ?? 'var(--gris)';
</script>

{#if lignes.length}
  <ul class="groupes" aria-label="Filtrer par groupe">
    {#each colonnes as g (g.sigle)}
      <li>
        <button
          type="button"
          class="rangee"
          class:eteint={choix !== null && choix !== g.sigle}
          aria-pressed={choix === g.sigle}
          aria-label="{g.sigle} ({g.nom}) : décisif pour {g.vote} loi{g.vote > 1 ? 's' : ''}{g.abst
            ? `, et ${g.abst} par son abstention`
            : ''}. Afficher ses lois"
          onclick={() => (choix = choix === g.sigle ? null : g.sigle)}
        >
          <span class="groupe">
            <span class="puce" style:background={couleur(g)}></span>
            <span class="sigle">{g.sigle}</span>
          </span>
          <span class="carres" aria-hidden="true">
            {#each g.lois as l (l.id)}
              <span
                class="carre"
                class:abst={estAbst(l, g.sigle)}
                style:--c={couleur(g)}
                title="{l.titre_court}{estAbst(l, g.sigle) ? ' (par son abstention)' : ''}"
              ></span>
            {/each}
          </span>
          <span class="effectif">
            <span class="nombre">{g.vote}</span>
            {#if g.abst}<span class="petit secondaire">+{g.abst} abst.</span>{/if}
          </span>
        </button>
      </li>
    {/each}
  </ul>
  <p class="legende petit secondaire">
    Carré plein&#8239;: décisif par son vote. Carré vide&#8239;: décisif par son abstention (s’il
    avait voté contre, le texte tombait). Cliquer un groupe pour ne garder que ses lois.
  </p>

  <div class="titre-liste">
    <h3>
      {#if choisi}
        Les {filtrees.length} lois où {choisi.sigle} a été décisif
      {:else}
        Les {lignes.length} lois avec au moins un groupe décisif hors socle
      {/if}
    </h3>
    {#if choisi}
      <button type="button" class="lien petit" onclick={() => (choix = null)}
        >Revenir à tous les groupes</button
      >
    {/if}
  </div>

  <div class="defile grand">
    <table>
      <thead>
        <tr>
          <th scope="col" class="loi">Loi</th>
          {#each colonnes as g (g.sigle)}
            <th scope="col" class="col" class:actif={choix === g.sigle} title={g.nom}>{g.sigle}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each visibles as l (l.id)}
          <tr>
            <th scope="row" class="loi">
              <span class="cellule-loi">
                <span class="pastille ch-{l.chemin}" title={LIBELLE_CHEMIN[l.chemin]}></span>
                <span class="texte">
                  <a href="/lois/{l.id}">{l.titre_court}</a>
                  <span class="meta petit">
                    <span class="chiffres">{dateCourte(l.date_adoption).slice(3)}</span>
                    <Themes themes={l.themes} />
                  </span>
                </span>
              </span>
            </th>
            {#each colonnes as g (g.sigle)}
              <td class="col" class:actif={choix === g.sigle}>
                {#if estVote(l, g.sigle)}
                  <span class="disque" style:background={couleur(g)}
                    ><span class="visuellement-cache">{g.sigle} décisif par son vote</span></span
                  >
                {:else if estAbst(l, g.sigle)}
                  <span class="cercle" style:border-color={couleur(g)}
                    ><span class="visuellement-cache">{g.sigle} décisif par son abstention</span
                    ></span
                  >
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <ul class="mobile">
    {#each visibles as l (l.id)}
      <li>
        <span class="pastille ch-{l.chemin}" title={LIBELLE_CHEMIN[l.chemin]}></span>
        <span class="texte">
          <a href="/lois/{l.id}">{l.titre_court}</a>
          <span class="meta petit">
            <span class="chiffres">{dateCourte(l.date_adoption).slice(3)}</span>
            {#each colonnes.filter((g) => decisif(l, g.sigle)) as g (g.sigle)}
              <span class="badge">
                {#if estVote(l, g.sigle)}
                  <span class="disque mini" style:background={couleur(g)}></span>
                {:else}
                  <span class="cercle mini" style:border-color={couleur(g)}></span>
                {/if}
                {g.sigle}
              </span>
            {/each}
          </span>
        </span>
      </li>
    {/each}
  </ul>

  {#if !choisi && filtrees.length > APERCU}
    <button type="button" class="lien plus" onclick={() => (tout = !tout)}>
      {tout ? 'Afficher seulement les plus récentes' : `Voir les ${filtrees.length} lois`}
    </button>
  {/if}
{:else}
  <p class="secondaire">Aucun groupe hors socle n’a été décisif sur cette période.</p>
{/if}

<style>
  .groupes {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .groupes li {
    border-top: 1px solid var(--filet);
  }
  .rangee {
    width: 100%;
    display: grid;
    grid-template-columns: 7rem 1fr 5.5rem;
    gap: 12px;
    align-items: center;
    background: none;
    border: none;
    padding: 7px 0;
    cursor: pointer;
    text-align: left;
  }
  .rangee:hover .sigle,
  .rangee[aria-pressed='true'] .sigle {
    text-decoration: underline;
  }
  .rangee.eteint {
    opacity: 0.4;
  }
  .groupe {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }
  .puce {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
    flex: none;
  }
  .carres {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .carre {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    background: var(--c);
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.12);
  }
  .carre.abst {
    background: var(--papier);
    box-shadow: inset 0 0 0 2px var(--c);
  }
  .effectif {
    text-align: right;
    display: grid;
    line-height: 1.1;
  }
  .effectif .nombre {
    font-size: 1.5rem;
  }
  .legende {
    margin-top: 8px;
    max-width: var(--colonne);
  }
  .titre-liste {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 16px;
    margin-top: 20px;
  }
  h3 {
    font-size: 1.25rem;
  }
  .lien {
    background: none;
    border: none;
    padding: 0;
    color: var(--lien);
    text-decoration: underline;
    cursor: pointer;
  }
  .plus {
    margin-top: 10px;
    font-weight: 700;
  }
  table {
    width: 100%;
    font-size: 0.9375rem;
    margin-top: 8px;
  }
  th,
  td {
    padding: 7px 8px;
    border-bottom: 1px solid var(--filet);
    font-weight: 400;
  }
  thead th {
    border-bottom: 1px solid var(--encre);
    font-size: 0.8125rem;
    font-weight: 700;
    vertical-align: bottom;
  }
  .loi {
    text-align: left;
    padding-left: 0;
  }
  .cellule-loi,
  .mobile li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 8px;
    align-items: baseline;
  }
  .texte {
    display: grid;
    gap: 2px;
  }
  .texte a {
    text-decoration: none;
  }
  .texte a:hover {
    text-decoration: underline;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 10px;
    color: var(--ardoise);
  }
  .col {
    text-align: center;
    width: 3.6rem;
    white-space: nowrap;
  }
  .col.actif {
    background: var(--plan);
  }
  .disque,
  .cercle {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    vertical-align: middle;
  }
  .disque {
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.2);
  }
  .cercle {
    border: 2.5px solid;
  }
  .disque.mini,
  .cercle.mini {
    width: 10px;
    height: 10px;
  }
  .cercle.mini {
    border-width: 2px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    color: var(--encre);
  }
  .mobile {
    display: none;
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
  }
  .mobile li {
    padding: 8px 0;
    border-bottom: 1px solid var(--filet);
  }
  @media (max-width: 640px) {
    .rangee {
      grid-template-columns: 1fr auto;
    }
    .carres {
      grid-column: 1 / -1;
      grid-row: 2;
    }
    .effectif {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .grand {
      display: none;
    }
    .mobile {
      display: block;
    }
  }
</style>
