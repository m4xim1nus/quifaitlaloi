<script lang="ts">
  // Un vote décrit en entier : phrases, barre de majorité, hémicycle, position de chaque groupe.
  // Même présentation que la fiche d'une loi (routes/lois/[id]), réutilisée par les textes en cours.
  import Majorite from './Majorite.svelte';
  import Hemicycle from './Hemicycle.svelte';
  import Groupes from './Groupes.svelte';
  import Comment from './Comment.svelte';
  import { DEFINITION_CLASSE, LIBELLE_CLASSE } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import { phrasesScrutin } from '$lib/recit';
  import { lienScrutin, numeroScrutin } from '$lib/liens';
  import type { ScrutinDetaille, TypeLecture } from '$lib/types';

  interface Props {
    titre: string;
    s: ScrutinDetaille;
    typeLecture?: TypeLecture | null;
    couleurs: Record<string, string>;
  }
  let { titre, s, typeLecture = null, couleurs }: Props = $props();

  const LECTURE_MIN: Record<string, string> = {
    premiere: 'première lecture',
    deuxieme: 'deuxième lecture',
    nouvelle: 'nouvelle lecture',
    definitive: 'lecture définitive',
    cmp: 'texte de la commission mixte paritaire'
  };
  const censure = $derived(s.objet === 'motion_censure');
  const intitule = $derived(
    censure
      ? 'Motion de censure'
      : s.objet === 'motion_rejet'
        ? `Motion de rejet${s.chambre === 'SN' ? ' (question préalable)' : ' préalable'}`
        : s.objet === 'suppression_article_unique'
          ? 'Suppression de l’article unique'
          : s.objet === 'partie'
            ? 'Vote sur une partie du texte'
            : 'Vote sur l’ensemble du texte'
  );
  // la coalition dit qui fait passer le texte : seulement pour un texte adopté
  const classe = $derived(
    s.signature && s.sort === 'adopte' && !censure && s.objet !== 'motion_rejet'
      ? s.signature.classe
      : null
  );
  const coul = $derived(s.chambre === 'AN' ? couleurs : {});
</script>

<section class="vote">
  <h2>{titre}</h2>
  <p class="secondaire petit">
    {intitule}{#if typeLecture && LECTURE_MIN[typeLecture]}, {LECTURE_MIN[typeLecture]}{/if}, le {dateLongue(
      s.date
    )}
    {#if lienScrutin(s.id)}
      — <a href={lienScrutin(s.id)} rel="external"
        >{numeroScrutin(s.id)} sur le site {s.chambre === 'AN' ? 'de l’Assemblée' : 'du Sénat'}</a
      >{/if}
  </p>
  {#if classe}
    <p class="etiquettes">
      <span class="etiquette" title={DEFINITION_CLASSE[classe]}>
        <span class="pastille" style:background="var(--co-{classe})"></span>
        {LIBELLE_CLASSE[classe]}
      </span>
      <Comment ancre="coalitions" />
    </p>
  {/if}
  <div class="phrases colonne">
    {#each phrasesScrutin(s) as p (p)}<p>{p}</p>{/each}
  </div>

  <Majorite {s} />

  <div class="hemi">
    <Hemicycle positions={s.positions} {censure} couleurs={coul} />
    <ul class="legende-votes petit">
      {#if censure}
        <li><span class="rond contre"></span> vote la censure</li>
        <li><span class="rond absent"></span> ne la vote pas (seuls les « pour » sont comptés)</li>
      {:else}
        <li><span class="rond pour"></span> pour</li>
        <li><span class="rond abstention"></span> abstention</li>
        <li><span class="rond contre"></span> contre</li>
        <li><span class="rond absent"></span> n’a pas pris part au vote</li>
      {/if}
    </ul>
  </div>

  <Groupes positions={s.positions} {censure} couleurs={coul} />
  <p class="petit secondaire colonne">
    Position du groupe&#8239;: la position majoritaire parmi ses membres qui ont voté, avec la part
    de ceux qui l’ont suivie. <Comment ancre="position" />
  </p>
</section>

<style>
  section {
    padding-top: 48px;
    display: grid;
    gap: 16px;
    border-top: 1px solid var(--filet);
    margin-top: 48px;
  }
  .etiquettes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .etiquette {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--filet);
    border-radius: 999px;
    padding: 3px 12px 3px 9px;
    font-weight: 700;
    font-size: 0.9375rem;
  }
  .phrases {
    display: grid;
    gap: 8px;
    font-size: 1.125rem;
  }
  .hemi {
    display: grid;
    gap: 8px;
    margin-top: 16px;
  }
  .legende-votes {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
  }
  .rond {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    vertical-align: -1px;
  }
  .rond.pour {
    background: var(--vo-pour);
  }
  .rond.contre {
    background: var(--vo-contre);
  }
  .rond.abstention {
    background: var(--vo-abstention);
  }
  .rond.absent {
    box-shadow: inset 0 0 0 1.5px var(--gris);
  }
</style>
