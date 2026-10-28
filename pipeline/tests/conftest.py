"""Fixtures : base produite et dumps bruts (tests `donnees`, sautés s'ils sont absents)."""

import pytest

from qfl.cli import RAW, SQLITE


@pytest.fixture(scope="session")
def base():
    if not SQLITE.exists():
        pytest.skip(f"base absente : {SQLITE} (lancer `qfl build`)")
    return SQLITE


@pytest.fixture(scope="session")
def raw():
    if not (RAW / "senat_dosleg/x/dosleg.sql").exists():
        pytest.skip(f"dumps absents : {RAW} (lancer `qfl download`)")
    return RAW
