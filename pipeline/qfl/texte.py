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
