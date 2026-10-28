"""Tests sur données réelles : base produite et dumps bruts."""

import polars as pl
import pytest

from qfl import check, senat

pytestmark = pytest.mark.donnees


def test_check_passe(base):
    ok, lignes = check.verifier(base)
    assert ok, "\n".join(l for l in lignes if l.startswith("ÉCHEC"))


def test_casseurs_payeurs_senat(raw):
    """Scrutin Sénat n° 41 (session 2026) : ventilation identique à senat.fr (docs/SOURCES.md)."""
    t = senat.dosleg(raw)
    scr = senat.scrutins(t)
    s = scr.filter(pl.col("id") == "SN2026-41").to_dicts()[0]
    assert (s["pour"], s["contre"], s["sort"]) == (229, 105, "adopte")
    v = senat.ventilation(t, scr, senat.histogroupes(raw)).filter(pl.col("scrutin_id") == "SN2026-41")
    r = {x["groupe_id"]: (x["pour"], x["contre"], x["abstention"]) for x in v.to_dicts()}
    assert r["UMP"] == (123, 0, 0)
    assert r["UNT"] == (15, 0, 0)
    assert r["SOC"] == (0, 62, 0)
    assert r["RDSE"] == (3, 10, 5)
