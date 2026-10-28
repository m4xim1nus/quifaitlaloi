<script lang="ts">
  import { FICHIERS } from '$lib/dictionnaire';
  import { dateLongue, entier } from '$lib/format';
  import { DEPOT, LICENCE, URL_LICENCE } from '$lib/site';

  let { data } = $props();

  const ko = (o: number) =>
    o > 1e6 ? `${(o / 1e6).toFixed(1).replace('.', ',')} Mo` : `${Math.round(o / 1e3)} ko`;
  const NOMS: Record<string, string> = {
    an_scrutins_17: 'Scrutins de l’Assemblée, XVIIe législature',
    an_scrutins_16: 'Scrutins de l’Assemblée, XVIe législature',
    an_dossiers_17: 'Dossiers législatifs de l’Assemblée, XVIIe législature',
    an_dossiers_16: 'Dossiers législatifs de l’Assemblée, XVIe législature',
    an_amo: 'Députés, groupes et organes de l’Assemblée (AMO)',
    senat_dosleg: 'Base des dossiers législatifs du Sénat (Dosleg)',
    senat_senateurs: 'Sénateurs et historique des groupes'
  };
</script>

<svelte:head>
  <title>Données · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Télécharger les données de QuiFaitLaLoi : base SQLite, fichiers CSV et JSON, sources et empreintes."
  />
</svelte:head>

<article class="donnees">
  <h1>Données</h1>
  <p class="chapo">
    Les données du site sont un instantané daté, versionné avec le code&#8239;: chaque mise à jour
    se lit comme une différence entre deux versions. Elles sont publiées sous {LICENCE} (<a
      href={URL_LICENCE}
      rel="external">conditions</a
    >), comme les données sources. Instantané du {dateLongue(data.date)}.
  </p>

  <section>
    <h2>Télécharger</h2>
    <ul class="telechargements">
      <li>
        <a href="/donnees/qfl.sqlite" download>qfl.sqlite</a>
        <span class="secondaire petit"
          >{ko(data.tailleSqlite)} · toutes les tables, une base SQLite</span
        >
      </li>
      <li>
        <a href="/donnees/metriques.json" download>metriques.json</a>
        <span class="secondaire petit"
          >{ko(data.tailles['metriques.json'])} · agrégats par trimestre et par période</span
        >
      </li>
      <li>
        <a href="/donnees/meta.json" download>meta.json</a>
        <span class="secondaire petit"
          >{ko(data.tailles['meta.json'])} · sources, date de génération, référentiels</span
        >
      </li>
    </ul>
  </section>

  <section>
    <h2>Les tables</h2>
    {#each FICHIERS as f (f.nom)}
      <div class="table">
        <h3><a href="/donnees/{f.nom}" download>{f.nom}</a></h3>
        <p class="secondaire petit">
          {entier(data.comptes[f.lignes] ?? 0)} lignes · {ko(data.tailles[f.nom])}. {f.description}
        </p>
        <dl>
          {#each f.colonnes as [col, def] (col)}
            <div>
              <dt><code>{col}</code></dt>
              <dd>{def}</dd>
            </div>
          {/each}
        </dl>
      </div>
    {/each}
  </section>

  <section>
    <h2>Sources</h2>
    <p>
      Fichiers téléchargés pour cet instantané, avec leur date de mise à jour côté producteur et
      leur empreinte SHA-256.
    </p>
    <div class="defile">
      <table class="sources petit">
        <thead>
          <tr>
            <th scope="col">Fichier</th>
            <th scope="col">Mis à jour</th>
            <th scope="col">Empreinte</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(data.sources) as [cle, s] (cle)}
            <tr>
              <td><a href={s.url} rel="external">{NOMS[cle] ?? cle}</a></td>
              <td class="chiffres">{dateLongue(new Date(s.last_modified).toISOString())}</td>
              <td><code class="empreinte">{s.sha256.slice(0, 16)}…</code></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="petit secondaire">
      Pour tout régénérer&#8239;: le pipeline (<code>uv run qfl download</code>, puis
      <code>uv run qfl build</code>) est dans le <a href={DEPOT} rel="external">dépôt du projet</a>.
    </p>
  </section>
</article>

<style>
  .donnees {
    padding-top: 48px;
    display: grid;
    gap: 20px;
    max-width: 46rem;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  section {
    display: grid;
    gap: 14px;
    padding-top: 28px;
  }
  .telechargements {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .telechargements a,
  h3 a {
    font-weight: 700;
  }
  .table {
    display: grid;
    gap: 6px;
    padding: 14px 0;
    border-top: 1px solid var(--filet);
  }
  h3 {
    font-family: var(--sans);
    font-size: 1.0625rem;
  }
  dl {
    margin: 0;
    display: grid;
    gap: 4px;
    font-size: 0.9375rem;
  }
  dl div {
    display: grid;
    grid-template-columns: minmax(10rem, 16rem) 1fr;
    gap: 12px;
  }
  dd {
    margin: 0;
    color: var(--ardoise);
  }
  code {
    font-size: 0.875em;
  }
  .defile {
    overflow-x: auto;
  }
  .sources {
    width: 100%;
  }
  .sources th,
  .sources td {
    text-align: left;
    padding: 6px 12px 6px 0;
    border-bottom: 1px solid var(--filet);
  }
  .empreinte {
    white-space: nowrap;
  }
  @media (max-width: 640px) {
    dl div {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }
</style>
