"""Ligne de commande : qfl download | build | check."""

import argparse
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
RAW = RACINE / "data/raw"
SQLITE = RACINE / "data/qfl.sqlite"
EXPORT = RACINE / "data/export"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="qfl", description=__doc__)
    sub = ap.add_subparsers(dest="commande", required=True)
    d = sub.add_parser("download", help="télécharge et extrait les dumps AN et Sénat")
    d.add_argument("--raw", type=Path, default=RAW)
    d.add_argument("sources", nargs="*", help="clés de sources (défaut : toutes)")
    b = sub.add_parser("build", help="dumps → data/qfl.sqlite + data/export/")
    b.add_argument("--raw", type=Path, default=RAW)
    b.add_argument("--sqlite", type=Path, default=SQLITE)
    b.add_argument("--export", type=Path, default=EXPORT)
    c = sub.add_parser("check", help="invariants et textes témoins sur la base produite")
    c.add_argument("--sqlite", type=Path, default=SQLITE)
    args = ap.parse_args(argv)

    if args.commande == "download":
        from . import sources
        sources.download(args.raw, args.sources or None)
    elif args.commande == "build":
        from . import build
        build.build(args.raw, args.sqlite, args.export)
    elif args.commande == "check":
        from . import check
        ok, lignes = check.verifier(args.sqlite)
        print("\n".join(lignes))
        print("\nTous les contrôles passent." if ok else "\nCONTRÔLE EN ÉCHEC.", file=sys.stderr)
        return 0 if ok else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
