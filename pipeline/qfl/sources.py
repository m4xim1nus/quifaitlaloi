"""Sources open data et téléchargement (docs/SOURCES.md).

Les dumps AN et Sénat sont régénérés chaque nuit : on ne les épingle pas
par sha256. `download` les récupère, les extrait dans `<raw>/<cle>/x/` et
note dans `<raw>/manifeste.json` l'URL, le `Last-Modified`, la taille et le
sha256 de chaque archive. Ce manifeste est recopié dans l'export : il date
l'instantané versionné.
"""

import hashlib
import json
import shutil
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import httpx

AN = "https://data.assemblee-nationale.fr/static/openData/repository"

SOURCES: dict[str, dict] = {
    "an_scrutins_17": {"url": f"{AN}/17/loi/scrutins/Scrutins.json.zip"},
    "an_dossiers_17": {"url": f"{AN}/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"},
    # XVIe et XVe : baselines, et lectures antérieures des lois de la XVIIe. Un
    # dossier présent dans plusieurs dumps est pris dans le plus récent.
    "an_scrutins_16": {"url": f"{AN}/16/loi/scrutins/Scrutins.json.zip"},
    "an_dossiers_16": {"url": f"{AN}/16/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"},
    "an_scrutins_15": {"url": f"{AN}/15/loi/scrutins/Scrutins_XV.json.zip"},
    "an_dossiers_15": {"url": f"{AN}/15/loi/dossiers_legislatifs/Dossiers_Legislatifs_XV.json.zip"},
    "an_amo": {"url": f"{AN}/17/amo/tous_acteurs_mandats_organes_xi_legislature/"
                      "AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip"},
    "senat_dosleg": {"url": "https://data.senat.fr/data/dosleg/dosleg.zip"},
    "senat_senateurs": {"url": "https://data.senat.fr/data/senateurs/ODSEN_HISTOGROUPES.csv", "zip": False},
}

MANIFESTE = "manifeste.json"


def sha256_fichier(chemin: Path) -> str:
    h = hashlib.sha256()
    with chemin.open("rb") as f:
        for bloc in iter(lambda: f.read(1 << 20), b""):
            h.update(bloc)
    return h.hexdigest()


def extraits(raw: Path, cle: str) -> Path:
    """Dossier où la source `cle` est extraite (ou le fichier lui-même s'il n'est pas zippé)."""
    src = SOURCES[cle]
    if src.get("zip", True):
        return raw / cle / "x"
    return raw / cle / src["url"].rsplit("/", 1)[1]


def lire_manifeste(raw: Path) -> dict:
    p = raw / MANIFESTE
    return json.loads(p.read_text()) if p.exists() else {}


def download(raw: Path, cles: list[str] | None = None) -> None:
    """Télécharge chaque source, l'extrait et met à jour le manifeste."""
    manifeste = lire_manifeste(raw)
    with httpx.Client(timeout=300, follow_redirects=True) as client:
        for cle in cles or list(SOURCES):
            src = SOURCES[cle]
            dossier = raw / cle
            dossier.mkdir(parents=True, exist_ok=True)
            cible = dossier / src["url"].rsplit("/", 1)[1]
            print(f"{cle} : téléchargement de {src['url']}", file=sys.stderr)
            with client.stream("GET", src["url"]) as r, cible.open("wb") as f:
                r.raise_for_status()
                modifie = r.headers.get("last-modified")
                for bloc in r.iter_bytes(1 << 20):
                    f.write(bloc)
            if src.get("zip", True):
                x = extraits(raw, cle)
                if x.exists():
                    shutil.rmtree(x)
                with zipfile.ZipFile(cible) as z:
                    z.extractall(x)
            manifeste[cle] = {
                "url": src["url"],
                "last_modified": modifie,
                "taille": cible.stat().st_size,
                "sha256": sha256_fichier(cible),
                "telecharge_le": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            print(f"{cle} : {cible} ({manifeste[cle]['taille']:,} o, {modifie})", file=sys.stderr)
            (raw / MANIFESTE).write_text(json.dumps(manifeste, indent=2, ensure_ascii=False) + "\n")
