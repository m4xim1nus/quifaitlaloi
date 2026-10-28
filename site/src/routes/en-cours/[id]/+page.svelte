<script lang="ts">
  // Fiche d'un texte en cours : ce n'est pas une loi. Son parcours jusqu'ici, ce qu'il attend,
  // et chaque vote nominatif déjà tenu, décrit comme le vote décisif d'une loi.
  import Parcours from '$lib/components/Parcours.svelte';
  import VoteDetaille from '$lib/components/VoteDetaille.svelte';
  import Comment from '$lib/components/Comment.svelte';
  import { dateLongue } from '$lib/format';
  import { libelleAttente, libelleDernierVote, libelleSeance, natureTexte } from '$lib/encours';

  let { data } = $props();
  const t = $derived(data.texte);

  const LECTURE: Record<string, string> = {
    premiere: '1re lecture',
    deuxieme: '2e lecture',
    nouvelle: 'nouvelle lecture',
    definitive: 'lecture définitive',
    cmp: 'texte de la CMP'
  };
  const CHAMBRE = { AN: 'de l’Assemblée', SN: 'du Sénat' } as const;
  const seance = $derived(libelleSeance(t, dateLongue));
  const etat = $derived(`${libelleAttente(t)}${seance ? ` · ${seance}` : ''}.`);
</script>

<svelte:head>
  <title>{t.titre_court} (en cours) · Qui fait la loi ?</title>
  <meta
    name="description"
    content="{t.titre}. Texte en cours, pas encore une loi. {libelleDernierVote(t)} le {dateLongue(
      t.date_derniere_lecture
    )}. {etat}"
  />
</svelte:head>

<article>
  <nav class="fil petit" aria-label="Fil d’Ariane">
    <a href="/en-cours">Textes en cours</a> › {t.id}
  </nav>

  <header class="tete">
    <p class="statut"><span class="marque-statut">En cours</span> Pas encore une loi</p>
    <h1>{t.titre_court}</h1>
    {#if t.titre_court !== t.titre}<p class="officiel secondaire">{t.titre}</p>{/if}
    <p class="etat">
      {etat}
      <Comment ancre="en-cours" />
    </p>
    <dl class="faits petit">
      <div>
        <dt>Nature</dt>
        <dd>{natureTexte(t)}</dd>
      </div>
      {#if t.date_depot}
        <div>
          <dt>Dépôt</dt>
          <dd>{dateLongue(t.date_depot)}</dd>
        </div>
      {/if}
      <div>
        <dt>Dernier vote</dt>
        <dd>{libelleDernierVote(t)}, le {dateLongue(t.date_derniere_lecture)}</dd>
      </div>
      {#if t.themes.length}
        <div>
          <dt>Thèmes (Sénat)</dt>
          <dd>{t.themes.join(', ')}</dd>
        </div>
      {/if}
      <div>
        <dt>Procédure accélérée</dt>
        <dd>{t.procedure_acceleree ? 'oui (une lecture par chambre avant la CMP)' : 'non'}</dd>
      </div>
    </dl>
  </header>

  <section>
    <h2>Le parcours jusqu’ici</h2>
    <Parcours lectures={data.lectures} evenements={data.evenements} />
  </section>

  {#each data.votes as v (v.s.id)}
    <VoteDetaille
      titre="Le vote {CHAMBRE[v.s.chambre]}, {LECTURE[v.lecture.type_lecture] ??
        v.lecture.type_lecture}"
      s={v.s}
      typeLecture={v.lecture.type_lecture}
      couleurs={data.couleurs}
    />
  {/each}

  <section>
    <h2>Sources</h2>
    <ul class="sources">
      {#if t.url_an}<li>
          <a href={t.url_an} rel="external">Dossier législatif sur le site de l’Assemblée</a>
        </li>{/if}
      {#if t.url_senat}<li>
          <a href={t.url_senat} rel="external">Dossier législatif sur le site du Sénat</a>
        </li>{/if}
      <li>
        <a href="/donnees">Données de cette fiche</a> (identifiant <code>{t.id}</code> dans
        <code>en_cours.csv</code>)
      </li>
    </ul>
  </section>
</article>

<style>
  article {
    display: grid;
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
  .statut {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ardoise);
    font-size: 0.9375rem;
  }
  .marque-statut {
    border: 1.5px dashed var(--encre);
    border-radius: 999px;
    padding: 1px 10px;
    color: var(--encre);
    font-weight: 700;
  }
  h1 {
    font-size: clamp(2rem, 5vw, 3.25rem);
    max-width: 22ch;
  }
  .officiel {
    max-width: var(--colonne);
  }
  .etat {
    font-family: var(--serif);
    font-size: 1.1875rem;
    line-height: 1.5;
    max-width: 62ch;
    margin: 0;
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
