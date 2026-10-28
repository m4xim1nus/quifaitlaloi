<script lang="ts">
  import Parcours from '$lib/components/Parcours.svelte';
  import Majorite from '$lib/components/Majorite.svelte';
  import Hemicycle from '$lib/components/Hemicycle.svelte';
  import Groupes from '$lib/components/Groupes.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import {
    DEFINITION_CHEMIN,
    DEFINITION_CLASSE,
    LIBELLE_CHEMIN,
    LIBELLE_CLASSE,
    LIBELLE_MODE,
    LIBELLE_TYPE
  } from '$lib/libelles';
  import { dateLongue } from '$lib/format';
  import { phrasesChemin, phrasesScrutin } from '$lib/recit';
  import { lienScrutin, numeroScrutin } from '$lib/liens';
  import type { ScrutinDetaille } from '$lib/types';

  let { data } = $props();
  const loi = $derived(data.loi);

  const resume = $derived(
    phrasesChemin(
      loi,
      data.chemin,
      data.lectures,
      data.censures,
      dateLongue,
      (m) => LIBELLE_MODE[m as keyof typeof LIBELLE_MODE]
    )
  );
  const LECTURE_MIN: Record<string, string> = {
    premiere: 'première lecture',
    deuxieme: 'deuxième lecture',
    nouvelle: 'nouvelle lecture',
    definitive: 'lecture définitive',
    cmp: 'texte de la commission mixte paritaire'
  };
  const intitule = (s: ScrutinDetaille) =>
    s.objet === 'motion_censure'
      ? 'Motion de censure'
      : s.objet === 'motion_rejet'
        ? `Motion de rejet${s.chambre === 'SN' ? ' (question préalable)' : ' préalable'}`
        : s.objet === 'suppression_article_unique'
          ? 'Suppression de l’article unique'
          : 'Vote sur l’ensemble du texte';
  const lectureDe = (s: ScrutinDetaille) => data.lectures.find((l) => l.id === s.lecture_id);
  const votes = $derived(
    [
      { titre: 'Le vote décisif à l’Assemblée', s: data.decisif_an },
      { titre: 'Le vote décisif au Sénat', s: data.decisif_sn }
    ].filter((v): v is { titre: string; s: ScrutinDetaille } => !!v.s && v.s.positions.length > 0)
  );
  const autresCensures = $derived(data.censures.filter((c) => c.id !== data.decisif_an?.id));
</script>

<svelte:head>
  <title>{loi.titre_court} · Qui fait la loi ?</title>
  <meta name="description" content="{loi.titre}. {resume.join(' ')}" />
</svelte:head>

<article>
  <nav class="fil petit" aria-label="Fil d’Ariane"><a href="/lois">Les lois</a> › {loi.id}</nav>

  <header class="tete">
    <h1>{loi.titre_court}</h1>
    {#if loi.titre_court !== loi.titre}<p class="officiel secondaire">{loi.titre}</p>{/if}
    <dl class="faits petit">
      <div>
        <dt>Type</dt>
        <dd>
          {LIBELLE_TYPE[loi.type]}{loi.sous_type === 'loi_speciale' ? ' (loi spéciale)' : ''}
        </dd>
      </div>
      <div>
        <dt>Origine</dt>
        <dd>
          {loi.initiative === 'projet'
            ? 'Projet de loi (Gouvernement)'
            : 'Proposition de loi (parlementaires)'}
        </dd>
      </div>
      <div>
        <dt>Adoption définitive</dt>
        <dd>{dateLongue(loi.date_adoption)}</dd>
      </div>
      {#if loi.date_promulgation}
        <div>
          <dt>Promulgation</dt>
          <dd>{dateLongue(loi.date_promulgation)}</dd>
        </div>
      {/if}
      <div>
        <dt>Procédure accélérée</dt>
        <dd>{loi.procedure_acceleree ? 'oui (une lecture par chambre avant la CMP)' : 'non'}</dd>
      </div>
    </dl>
  </header>

  <section class="resume">
    <div class="etiquettes">
      <span class="etiquette">
        <span class="pastille ch-{data.chemin}" class:vide={data.chemin === 'sans_scrutin'}></span>
        {LIBELLE_CHEMIN[data.chemin]}
      </span>
      {#if loi.classe_an}
        <span class="etiquette">
          <span class="pastille" style:background="var(--co-{loi.classe_an})"></span>
          {LIBELLE_CLASSE[loi.classe_an]}
        </span>
      {/if}
      <Comment ancre="chemins" />
    </div>
    <div class="phrases colonne">
      {#each resume as p (p)}<p>{p}</p>{/each}
    </div>
    <p class="definitions petit secondaire colonne">
      <strong>{LIBELLE_CHEMIN[data.chemin]}</strong>&#8239;: {DEFINITION_CHEMIN[data.chemin]}
      {#if loi.classe_an}
        <br /><strong>{LIBELLE_CLASSE[loi.classe_an]}</strong>&#8239;: {DEFINITION_CLASSE[
          loi.classe_an
        ]}
      {/if}
    </p>
  </section>

  <section>
    <h2>Le parcours</h2>
    <Parcours lectures={data.lectures} evenements={data.evenements} />
  </section>

  {#each votes as v (v.s.id)}
    {@const l = lectureDe(v.s)}
    {@const censure = v.s.objet === 'motion_censure'}
    <section class="vote">
      <h2>{v.titre}</h2>
      <p class="secondaire petit">
        {intitule(v.s)}{#if l}, {LECTURE_MIN[l.type_lecture]}{/if}, le {dateLongue(v.s.date)}
        {#if lienScrutin(v.s.id)}
          — <a href={lienScrutin(v.s.id)} rel="external"
            >{numeroScrutin(v.s.id)} sur le site {v.s.chambre === 'AN'
              ? 'de l’Assemblée'
              : 'du Sénat'}</a
          >{/if}
      </p>
      <div class="phrases colonne">
        {#each phrasesScrutin(v.s) as p (p)}<p>{p}</p>{/each}
      </div>

      <Majorite s={v.s} />

      <div class="hemi">
        <Hemicycle
          positions={v.s.positions}
          {censure}
          couleurs={v.s.chambre === 'AN' ? data.couleurs : {}}
        />
        <ul class="legende-votes petit">
          {#if censure}
            <li><span class="rond contre"></span> vote la censure</li>
            <li>
              <span class="rond absent"></span> ne la vote pas (seuls les « pour » sont comptés)
            </li>
          {:else}
            <li><span class="rond pour"></span> pour</li>
            <li><span class="rond abstention"></span> abstention</li>
            <li><span class="rond contre"></span> contre</li>
            <li><span class="rond absent"></span> n’a pas pris part au vote</li>
          {/if}
        </ul>
      </div>
      <p class="petit secondaire colonne">
        Chaque point est un siège, rangé dans son groupe de la gauche à la droite de l’hémicycle. La
        place d’un point dans son groupe ne correspond pas à un député.
        {#if v.s.chambre === 'AN'}Le vote de chaque député est sur le <a
            href={lienScrutin(v.s.id)}
            rel="external">site de l’Assemblée</a
          >.{/if}
      </p>

      <Groupes
        positions={v.s.positions}
        {censure}
        couleurs={v.s.chambre === 'AN' ? data.couleurs : {}}
      />
      <p class="petit secondaire colonne">
        Position du groupe&#8239;: la position majoritaire parmi ses députés qui ont voté, avec la
        part de ceux qui l’ont suivie. <Comment ancre="position" />
      </p>
    </section>
  {/each}

  {#if autresCensures.length}
    <section>
      <h2>Les motions de censure</h2>
      <ul class="censures">
        {#each autresCensures as c (c.id)}
          <li>
            {dateLongue(c.date)}&#8239;: {c.pour} voix sur {c.requis} requises,
            <strong>{c.sort === 'adopte' ? 'adoptée' : 'rejetée'}</strong>
            {#if lienScrutin(c.id)}(<a href={lienScrutin(c.id)} rel="external"
                >{numeroScrutin(c.id)}</a
              >){/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section>
    <h2>Sources</h2>
    <ul class="sources">
      {#if loi.url_an}<li>
          <a href={loi.url_an} rel="external">Dossier législatif sur le site de l’Assemblée</a>
        </li>{/if}
      {#if loi.url_senat}<li>
          <a href={loi.url_senat} rel="external">Dossier législatif sur le site du Sénat</a>
        </li>{/if}
      {#if loi.url_legifrance}<li>
          <a href={loi.url_legifrance} rel="external">Texte de la loi sur Légifrance</a>
        </li>{/if}
      <li>
        <a href="/donnees">Données de cette fiche</a> (identifiant <code>{loi.id}</code> dans
        <code>lois.csv</code>)
      </li>
    </ul>
  </section>
</article>

<style>
  article {
    display: grid;
    gap: 0;
  }
  section {
    padding-top: 48px;
    display: grid;
    gap: 16px;
  }
  .fil {
    padding-top: 32px;
    color: var(--ardoise);
  }
  .tete {
    padding-top: 12px;
    display: grid;
    gap: 12px;
  }
  h1 {
    font-size: clamp(2rem, 5vw, 3.25rem);
    max-width: 22ch;
  }
  .officiel {
    max-width: var(--colonne);
  }
  .faits {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
    margin: 4px 0 0;
  }
  .faits div {
    display: grid;
  }
  dt {
    color: var(--ardoise);
  }
  dd {
    margin: 0;
    font-weight: 700;
  }
  .resume {
    padding-top: 28px;
  }
  .etiquettes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
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
  .pastille {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    display: inline-block;
  }
  .ch-solennel {
    background: var(--ch-solennel);
  }
  .ch-ordinaire {
    background: var(--ch-ordinaire);
  }
  .ch-rejet_inverse {
    background: var(--ch-rejet_inverse);
  }
  .ch-art_49_3 {
    background: var(--ch-art_49_3);
  }
  .phrases {
    display: grid;
    gap: 8px;
    font-size: 1.125rem;
  }
  .definitions {
    border-left: 2px solid var(--filet);
    padding-left: 12px;
  }
  .vote {
    border-top: 1px solid var(--filet);
    margin-top: 48px;
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
  .censures,
  .sources {
    padding-left: 1.1em;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  code {
    font-size: 0.875em;
  }
</style>
