<script lang="ts">
  import {
    CHEMINS,
    CLASSES,
    DEFINITION_CHEMIN,
    DEFINITION_CLASSE,
    JALON,
    LIBELLE_BLOC,
    LIBELLE_CHEMIN,
    LIBELLE_CLASSE
  } from '$lib/libelles';
  import { dateLongue, pourcent } from '$lib/format';
  import { DEPOT } from '$lib/site';
  import type { Bloc } from '$lib/types';

  let { data } = $props();
  const c = $derived(data.comptes);
  const BLOCS: Bloc[] = ['gauche', 'centre', 'droite', 'rn', 'autres'];
  const METHODO = `${DEPOT}/blob/main/docs/METHODO.md`;
  const REFERENTIELS = `${DEPOT}/tree/main/pipeline/referentiels`;
</script>

<svelte:head>
  <title>Méthodologie · Qui fait la loi ?</title>
  <meta
    name="description"
    content="Comment QuiFaitLaLoi classe les lois : sources, chemins d’adoption, coalitions, groupes décisifs, choix assumés et limites."
  />
</svelte:head>

<article class="methodo">
  <h1>Méthodologie</h1>
  <p class="chapo">
    Tout ce que le site affiche se recalcule à partir de l’open data de l’Assemblée nationale et du
    Sénat, avec des règles fixes écrites ci-dessous. Les choix qui relèvent d’un jugement (le
    classement des groupes en blocs, notamment) sont affichés tels quels. Version technique&#8239;:
    <a href={METHODO} rel="external">docs/METHODO.md</a>.
  </p>

  <nav class="sommaire petit" aria-label="Sommaire">
    <a href="#perimetre">Périmètre</a>
    <a href="#sources">Sources</a>
    <a href="#lectures">Lectures et vote décisif</a>
    <a href="#chemins">Chemins</a>
    <a href="#contournement">Contournement</a>
    <a href="#position">Position d’un groupe</a>
    <a href="#blocs">Blocs</a>
    <a href="#coalitions">Coalitions</a>
    <a href="#decisif">Groupe décisif</a>
    <a href="#periodes">Périodes</a>
    <a href="#limites">Limites</a>
  </nav>

  <section id="perimetre">
    <h2>Périmètre</h2>
    <p>
      Les lois promulguées depuis le début de la XVIIe législature (18 juillet 2024)&#8239;: {c.lois}
      au {dateLongue(data.date)}. S’y ajouteraient les textes adoptés définitivement mais pas encore
      promulgués&#8239;; il n’y en a aucun à cette date. Pour chaque loi, toutes ses lectures sont
      prises en compte, y compris celles tenues avant la dissolution de juin 2024.
    </p>
    <p id="accords">
      <strong>Accords internationaux.</strong>
      {c.accords} lois autorisent la ratification ou l’approbation d’un traité (article 53 de la Constitution).
      Elles passent presque toujours en procédure d’examen simplifiée, sans vote nominatif, et écraseraient
      les autres catégories&#8239;: le site les retire par défaut, et un interrupteur permet de les inclure.
      Chaque chiffre existe dans les deux versions.
    </p>
  </section>

  <section id="sources">
    <h2>Sources</h2>
    <p>
      Uniquement des données publiques officielles&#8239;: les dossiers législatifs, les scrutins
      publics et le référentiel des députés de l’Assemblée nationale (<a
        href="https://data.assemblee-nationale.fr"
        rel="external">data.assemblee-nationale.fr</a
      >)&#8239;; la base des dossiers législatifs du Sénat, ses scrutins et l’historique des groupes
      (<a href="https://data.senat.fr" rel="external">data.senat.fr</a>). Les fichiers utilisés,
      leur date et leur empreinte sont listés sur la page <a href="/donnees">Données</a>. Le site
      <a href="https://datan.fr" rel="external">datan.fr</a> a servi de contrôle croisé (mêmes chiffres,
      groupe par groupe, sur les scrutins vérifiés), jamais de source.
    </p>
  </section>

  <section id="lectures">
    <h2>Lectures et vote décisif</h2>
    <p>
      Une <strong>lecture</strong> est le passage d’un texte dans une chambre, conclu par une
      décision de séance&#8239;: première ou deuxième lecture, nouvelle lecture, lecture définitive
      à l’Assemblée, ou vote du texte de la commission mixte paritaire (CMP) dans chaque chambre. {c.lectures}
      lectures au total ({c.lecturesAN} à l’Assemblée, {c.lecturesSN} au Sénat).
    </p>
    <p>
      Le <strong>vote décisif</strong> d’une lecture est celui qui la conclut&#8239;: le vote sur l’ensemble
      du texte (ou sur son article unique), ou la motion de rejet adoptée si le texte est rejeté. Sur
      un 49.3, c’est la motion de censure. Quand aucun scrutin public n’est rattaché à la lecture, elle
      est classée « sans vote nominatif ». Le vote décisif d’une loi est celui de sa dernière lecture
      à l’Assemblée (au Sénat, pour la partie Sénat de la fiche).
    </p>
    <p>
      Les <strong>thèmes</strong> affichés sur chaque loi (« Justice », « Transports »…) sont ceux du
      Sénat, tirés de sa base Dosleg (une à quatre par loi, sur une liste de trente) ; « Société », très
      large, est toujours placé en dernier.
    </p>
    <p>
      Le dossier de l’Assemblée contient des erreurs de codage (décisions du Sénat mal étiquetées,
      lectures de CMP sans chambre…). Elles sont corrigées par des règles explicites, détaillées
      dans la version technique.
    </p>
  </section>

  <section id="chemins">
    <h2>Chemins à l’Assemblée</h2>
    <p>
      Chaque loi reçoit un chemin, d’après ses lectures à l’Assemblée. Si l’une d’elles est passée
      au 49.3, ou par un rejet par ses partisans, c’est ce chemin qui est retenu, quelle que soit la
      dernière lecture. Sinon, c’est le mode de la dernière lecture.
    </p>
    <dl class="definitions">
      {#each CHEMINS as ch (ch)}
        <div>
          <dt>
            <span class="pastille ch-{ch}" class:vide={ch === 'sans_scrutin'}></span>
            {LIBELLE_CHEMIN[ch]}
          </dt>
          <dd>{DEFINITION_CHEMIN[ch]}</dd>
        </div>
      {/each}
    </dl>
    <p class="encadre">
      <strong>« Sans vote nominatif » ne veut pas dire consensus.</strong> Il n’y a simplement pas d’information
      sur le vote de chaque groupe. Cette catégorie n’est jamais regroupée avec les lois adoptées largement.
      Un échantillon de 16 lectures a été vérifié sur les comptes rendus des séances&#8239;: 14 confirmées,
      2 erreurs corrigées par de nouvelles règles.
    </p>
    <p id="rejet-inverse">
      <strong>Règle du rejet par ses partisans</strong> (dit « rejet inversé »). Une motion de rejet préalable
      adoptée à l’Assemblée est classée ainsi si deux conditions sont réunies&#8239;: le texte part ensuite
      en commission mixte paritaire, et plus de la moitié des voix pour la motion viennent de groupes
      qui votent ensuite pour le texte final (sur un 49.3&#8239;: qui ne votent pas la censure). La règle
      s’applique seule, sans jugement au cas par cas. Résultat&#8239;:
    </p>
    <ul>
      {#each c.rejetsInverses as r (r.loi.id)}
        <li>
          <a href="/lois/{r.loi.id}">{r.loi.titre_court}</a>&#8239;: {r.score === null
            ? ''
            : pourcent(r.score)} des voix de la motion
        </li>
      {/each}
    </ul>
    <p>
      Le <strong>vote bloqué</strong> (article 44, alinéa 3, de la Constitution) n’apparaît dans aucun
      intitulé de scrutin&#8239;: il ne peut être repéré qu’à la main. Aucun cas n’est retenu à ce jour.
    </p>
  </section>

  <section id="contournement">
    <h2>Contournement</h2>
    <p>
      Une loi est comptée comme un contournement si l’une de ses lectures à l’Assemblée est passée
      au 49.3 ou par un rejet par ses partisans, ou si un vote bloqué y a été utilisé. Le mot
      désigne le fait que l’Assemblée ne s’est pas prononcée sur le texte <em>à cette étape</em
      >&#8239;; il ne dit rien de la légalité de la procédure, toutes prévues par la Constitution.
      La transmission d’un budget au Sénat à l’expiration des délais (articles 47 et 47-1) est
      signalée sur la fiche, mais n’est pas comptée comme un contournement.
    </p>
  </section>

  <section id="position">
    <h2>Position d’un groupe</h2>
    <ul>
      <li>
        <strong>Position</strong>&#8239;: la position majoritaire parmi les députés du groupe qui
        ont voté (pour, contre ou abstention). Ceux qui n’ont pas pris part au vote sont exclus. En
        cas d’égalité, le groupe est « partagé ».
      </li>
      <li>
        <strong>Cohésion</strong>&#8239;: la part des votants du groupe qui ont suivi cette
        position. Un groupe « pour à 55 % » n’est pas un groupe « pour à 98 % »&#8239;: la cohésion
        est toujours affichée à côté de la position.
      </li>
      <li>
        <strong>Abstention</strong>&#8239;: au sens du Règlement, elle n’est pas un suffrage
        exprimé. Elle est pourtant comptée ici comme une position possible, sinon un groupe qui
        s’abstient en bloc n’aurait jamais la position « abstention ».
      </li>
      <li>
        <strong>Motion de censure</strong>&#8239;: seules les voix pour sont recueillies. Un groupe
        « vote la censure » si plus de la moitié de ses membres la votent.
      </li>
      <li>
        <strong>Décompte</strong>&#8239;: à l’Assemblée, celui publié pour chaque groupe dans le
        scrutin. Au Sénat, les votes nominatifs sont recomptés selon le groupe de chaque sénateur à
        la date du scrutin.
      </li>
    </ul>
  </section>

  <section id="blocs">
    <h2>Blocs</h2>
    <p>
      Pour décrire une coalition, les groupes sont rangés en cinq blocs. C’est un choix&#8239;: il
      est affiché ici en entier, et versionné dans le <a href={REFERENTIELS} rel="external"
        >référentiel <code>blocs.yaml</code></a
      >. Le <strong>socle commun</strong> est le bloc gouvernemental de référence&#8239;: le centre seul
      sous la XVIe législature, le centre et la droite sous la XVIIe.
    </p>
    <div class="defile">
      <table class="blocs">
        <thead>
          <tr>
            <th scope="col">Bloc</th>
            <th scope="col">Assemblée, XVIIe</th>
            <th scope="col">Assemblée, XVIe</th>
            <th scope="col">Sénat</th>
          </tr>
        </thead>
        <tbody>
          {#each BLOCS as b (b)}
            <tr>
              <th scope="row">{data.blocs[b]?.libelle ?? LIBELLE_BLOC[b]}</th>
              {#each [17, 16] as leg (leg)}
                <td>
                  {#each data.groupesAN.filter((g) => g.leg === leg && g.bloc === b) as g, i (g.sigle + i)}
                    <span class="groupe" title={g.nom}
                      ><span class="puce" style:background={g.couleur ?? 'transparent'}
                      ></span>{g.sigle}</span
                    >
                  {/each}
                </td>
              {/each}
              <td>
                {#each data.groupesSN.filter((g) => g.bloc === b) as g (g.sigle)}
                  <span class="groupe" title={g.nom}>{g.sigle}</span>
                {/each}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <ul class="petit">
      <li>
        LR (Droite républicaine) forme un bloc à part&#8239;; sous la XVIIe, il est compté dans le
        socle sur toute la législature, y compris après son refus de participer au gouvernement
        Lecornu II (octobre 2025). Dater cette sortie du socle est à l’étude.
      </li>
      <li>UDR, puis le groupe qui lui succède (UDDPLR), sont rangés avec le RN.</li>
      <li>LIOT, le RDSE et les non-inscrits forment le bloc « autres ».</li>
      <li>
        Au Sénat, les sénateurs RN siégeaient parmi les non-inscrits jusqu’à la création du groupe
        UNT (5 octobre 2026)&#8239;: avant cette date, ils sont comptés dans « autres ».
      </li>
      <li>
        Les couleurs des groupes sont celles publiées par l’Assemblée dans son référentiel. Le Sénat
        n’en publie pas. Les couleurs des chemins, des coalitions et des votes ne reprennent aucune
        couleur de parti.
      </li>
    </ul>
  </section>

  <section id="coalitions">
    <h2>Coalitions</h2>
    <p>
      Pour chaque vote décisif, on prend le <strong>camp gagnant</strong>&#8239;: les « pour » si le
      texte est adopté, les « contre » s’il est rejeté, et sur une censure rejetée, les groupes qui
      ne la votent pas. La coalition se lit ensuite dans l’ordre suivant&#8239;:
    </p>
    <dl class="definitions">
      {#each CLASSES as cl (cl)}
        <div>
          <dt>
            <span class="pastille" style:background="var(--co-{cl})"></span>
            {LIBELLE_CLASSE[cl]}
          </dt>
          <dd>{DEFINITION_CLASSE[cl]}</dd>
        </div>
      {/each}
    </dl>
    <p>
      Une coalition dit qui a voté avec le socle, pas qui pouvait faire tomber le texte&#8239;:
      c’est l’objet du groupe décisif.
    </p>
  </section>

  <section id="decisif">
    <h2>Groupe décisif</h2>
    <p>
      Un groupe est décisif si, en votant à l’inverse, il renversait le résultat (règle du
      basculement)&#8239;:
    </p>
    <ul>
      <li>
        <strong>texte adopté</strong>&#8239;: si ses députés qui ont voté pour avaient voté contre,
        les « contre » l’emportaient et le texte tombait&#8239;;
      </li>
      <li>
        <strong>texte rejeté</strong>&#8239;: si ses députés qui ont voté contre avaient voté pour,
        il passait&#8239;;
      </li>
      <li>
        <strong>censure rejetée</strong>&#8239;: si tous ses membres l’avaient votée, elle obtenait
        la majorité des membres de l’Assemblée. Les groupes du socle le sont mécaniquement&#8239;;
        le site retient donc les groupes décisifs hors socle&#8239;;
      </li>
      <li>
        <strong>par son abstention</strong>&#8239;: si ses abstentionnistes avaient voté contre, le
        texte tombait.
      </li>
    </ul>
    <p>
      On ne compte que les députés qui ont pris part au vote&#8239;: faire voter les absents
      surestimerait le poids des groupes sur les scrutins peu suivis. Une règle plus stricte (le
      texte avait-il <em>besoin</em> de ses voix, ses « pour » devenant des abstentions) retient environ
      trois fois moins de lois ; elle mesure la nécessité, pas le pouvoir du groupe.
    </p>
    <p>
      Le calcul se fait groupe par groupe. Sur le budget 2025 (motion de censure de février
      2025&#8239;: 128 voix pour 289 requises), ni le RN ni le PS n’étaient décisifs seuls&#8239;:
      la censure n’aurait abouti qu’avec les deux. Ce cas de « décisif à deux » n’est pas encore
      compté.
    </p>
  </section>

  <section id="periodes">
    <h2>Périodes</h2>
    <p>
      Les lois sont datées par leur adoption définitive, et regroupées entre les dates charnières
      suivantes&#8239;:
    </p>
    <ul>
      {#each data.periodes.filter((p) => JALON[p.code]) as p (p.code)}
        <li><strong>{dateLongue(p.debut)}</strong>&#8239;: {JALON[p.code]} ({p.libelle})</li>
      {/each}
    </ul>
    <p>
      La date des « accords » avec le PS est celle de l’annonce de la suspension de la réforme des
      retraites par le Premier ministre, le 14 octobre 2025.
    </p>
  </section>

  <section id="limites">
    <h2>Limites connues</h2>
    <ul>
      <li>Au Sénat, le scrutin solennel n’est pas distingué du scrutin ordinaire.</li>
      <li>
        L’absence de vote nominatif n’a été vérifiée que sur un échantillon de 16 lectures. Pour les
        accords internationaux, la procédure d’examen simplifiée n’est pas encore distinguée du vote
        à main levée ordinaire.
      </li>
      <li>Le vote bloqué n’est repéré qu’à la main.</li>
      <li>
        Une lecture de l’Assemblée tenue sous la XVe législature (avant juin 2022) n’a pas son
        scrutin&#8239;: les votes de cette législature ne sont pas encore intégrés.
      </li>
      <li>
        Le site ne compte que les lois adoptées&#8239;: les textes rejetés ou retirés n’y figurent
        pas.
      </li>
    </ul>
    <p>
      Une erreur, un cas mal classé&#8239;? Le code et les données sont publics&#8239;: <a
        href="{DEPOT}/issues"
        rel="external">signaler un problème</a
      >.
    </p>
  </section>
</article>

<style>
  .methodo {
    padding-top: 48px;
    display: grid;
    gap: 20px;
    max-width: 46rem;
  }
  .chapo {
    font-size: 1.1875rem;
  }
  .sommaire {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    padding: 12px 0;
    border-top: 1px solid var(--filet);
    border-bottom: 1px solid var(--filet);
  }
  section {
    display: grid;
    gap: 14px;
    padding-top: 28px;
    scroll-margin-top: 16px;
  }
  [id] {
    scroll-margin-top: 16px;
  }
  ul {
    padding-left: 1.1em;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .definitions {
    margin: 0;
    display: grid;
    gap: 12px;
  }
  .definitions div {
    display: grid;
    gap: 2px;
  }
  dt {
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  dd {
    margin: 0 0 0 20px;
    color: var(--ardoise);
  }
  .encadre {
    border-left: 3px solid var(--encre);
    padding: 4px 0 4px 14px;
  }
  .defile {
    overflow-x: auto;
  }
  .blocs {
    width: 100%;
    font-size: 0.9375rem;
  }
  .blocs th,
  .blocs td {
    text-align: left;
    vertical-align: top;
    padding: 8px 12px 8px 0;
    border-bottom: 1px solid var(--filet);
  }
  .blocs thead th {
    font-size: 0.8125rem;
    color: var(--ardoise);
  }
  .groupe {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0 10px 2px 0;
    white-space: nowrap;
  }
  .puce {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
  }
</style>
