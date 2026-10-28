"""Normalisation des intitulés et classement de l'objet d'un scrutin."""

import re
import unicodedata


def nettoyer(t: str | None) -> str | None:
    """Répare l'encodage Dosleg (apostrophes cp1252 U+0092 dans de l'UTF-8) et les blancs de remplissage."""
    if t is None:
        return None
    return re.sub(r"\s+", " ", t.replace("\u0092", "’")).strip()


def norm(t: str | None) -> str:
    """Minuscules sans accents ni ponctuation, pour comparer des intitulés."""
    t = re.sub(r"[’'`\u0092]", " ", t or "")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t)).strip()


def cle_titre(titre: str | None, n: int = 40) -> str:
    """Début normalisé d'un titre de texte, sans « projet/proposition de loi (organique) »."""
    t = norm(titre)
    t = re.sub(r"^(le |la )?(projet|proposition) de loi (organique |constitutionnelle )?", "", t)
    return t[:n]


VIDES = set("avec dans pour sans sous vers entre contre leurs relative relatif visant portant "
             "projet proposition texte lecture premiere deuxieme nouvelle definitive commission mixte paritaire "
             "ensemble article unique loi les des aux par sur une son ses est qui que".split())


def mots(t: str | None) -> set[str]:
    """Mots significatifs d'un intitulé (trois lettres ou plus, hors mots-outils et de procédure)."""
    return {m for m in norm(t).split() if len(m) > 2 and m not in VIDES}


def similarite(a: str | None, b: str | None) -> float:
    """Part des mots significatifs de `b` (titre du texte) présents dans `a` (intitulé du scrutin)."""
    mb = mots(b)
    return len(mots(a) & mb) / len(mb) if mb else 0.0


# Objet d'un scrutin, d'après son intitulé normalisé (AN : « l'ensemble du
# projet… » ; Sénat : « sur l'ensemble du projet… »). Ordre significatif.
OBJETS = [
    ("ensemble", r"l ensemble"),
    ("ensemble", r"(le projet|la proposition) de loi"),  # texte à article unique voté d'un bloc
    ("article_unique", r"l article unique"),
    ("partie", r"la (premiere|deuxieme|troisieme|quatrieme) partie"),
    # amendement(s) de suppression de l'article unique : s'il est adopté, le texte est rejeté
    ("suppression_article_unique", r"(l |les )?amendements? .{0,200}de suppression de l article unique"),
    ("amendement", r"(l |le |les )?(sous )?amendements?"),
    ("article", r"(l |les )?articles?"),
    ("resolution", r"la proposition de resolution"),
    ("declaration", r"la declaration du gouvernement"),
]
# Motions : le type est dans le corps de l'intitulé (Sénat : « la motion n° 1,
# présentée par…, tendant à opposer la question préalable… »).
MOTIONS = [
    ("motion_censure", r"censure"),
    ("motion_rejet", r"rejet prealable|motion de rejet|question prealable|exception d irrecevabilite"),
    ("motion_renvoi", r"renvoi en commission"),
]


def objet_scrutin(titre: str | None) -> str:
    t = re.sub(r"^sur ", "", norm(titre))
    if t.startswith("la motion"):
        for objet, motif in MOTIONS:
            if re.search(motif, t[:250]):
                return objet
        return "motion_autre"
    for objet, motif in OBJETS:
        if re.match(motif, t):
            return objet
    return "autre"


# Titre court d'affichage (frise, explorateur) : le titre officiel de la loi sans « Loi
# visant à » ni « Loi autorisant l'approbation de », jamais coupé (le site passe à la ligne
# selon l'écran). On garde les mots du titre (aucune paraphrase) ; les exceptions vivent dans
# referentiels/titres_courts.yaml (budgets, noms d'usage).
_PREFIXE = re.compile(
    r"^(?:loi|projet de loi|proposition de loi)( organique| constitutionnelle)?\s+"
    r"(visant à |tendant à |relati(?:f|ve) (?:à la |à l’|au |aux |à )|portant |pour |"
    r"sur (?:la |le |l’|les )|autorisant )?",
    re.IGNORECASE)
# Conventions : « Loi autorisant l’approbation de l’accord entre le Gouvernement de la
# République française et le Gouvernement de la République X relatif à… » → « Accord avec la
# République X relatif à… ».
_APPROBATION = re.compile(r"^(l’|la )?(approbation|ratification) (de l’|de la |du |des |de )?", re.IGNORECASE)
_PARTIES = re.compile(r"entre (?:le Gouvernement de )?la (?:République française|France) et (?:le Gouvernement )?"
                      r"(de la |du |de l’|des |de |la |le |l’)?")
_ARTICLE = {"de la ": "la ", "du ": "le ", "de l’": "l’", "des ": "les ", "de ": ""}
_RELATIF = {"à la ": "la ", "à l’": "l’", "au ": "le ", "aux ": "les "}


def titre_court(titre: str | None) -> str | None:
    if not titre:
        return titre
    t = nettoyer(titre).replace("'", "’")
    m = _PREFIXE.match(t)
    if m and m.group(2):
        t = t[m.end():]
        if m.group(2) in ("visant à ", "tendant à "):
            t = t.replace(" et à ", " et ")  # « visant à X et à Y » → « X et Y »
        elif m.group(2).startswith("relati"):  # « relative à l’organisation, à la gestion et au… »
            t = re.sub(r"(,| et) (à la |à l’|au |aux )",
                       lambda x: f"{x.group(1)} {_RELATIF[x.group(2)]}", t)
    if a := _APPROBATION.match(t):
        t = t[a.end():]
    t = _PARTIES.sub(lambda p: "avec " + _ARTICLE.get(p.group(1) or "", p.group(1) or ""), t, count=1)
    return t[:1].upper() + t[1:]
