"""Référentiels maintenus à la main (pipeline/referentiels/*.yaml)."""

from functools import cache
from pathlib import Path

import yaml

DOSSIER = Path(__file__).resolve().parents[1] / "referentiels"


@cache
def charger(nom: str) -> dict:
    return yaml.safe_load((DOSSIER / f"{nom}.yaml").read_text())


def blocs() -> dict:
    return charger("blocs")


def codes_actes() -> dict:
    return charger("codes_actes")


def flags() -> dict:
    return charger("flags")


def periodes() -> dict:
    return charger("periodes")


def socle(legislature: int) -> list[str]:
    return blocs()["socle"][legislature]["blocs"]


def groupe_an(legislature: int, organe: str) -> dict:
    """Sigle et bloc d'un groupe AN ; échoue si l'organe n'est pas mappé (à ajouter dans blocs.yaml)."""
    try:
        return blocs()["assemblee"][legislature][organe]
    except KeyError:
        raise SystemExit(f"groupe AN {organe} (XV{'I' * (legislature - 15)}e) absent de blocs.yaml") from None


def groupe_senat(code: str) -> dict:
    try:
        return blocs()["senat"][code]
    except KeyError:
        raise SystemExit(f"groupe Sénat {code} absent de blocs.yaml") from None
