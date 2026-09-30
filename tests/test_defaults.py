"""The frozen detection/tracking parameters are defined once, in pipeline/tracker.py.

Every case study and live run must use them unchanged, so a script that defines
its own copy (which could silently drift) fails this test.
"""
import ast
import inspect
from pathlib import Path

from pipeline import tracker

ROOT = Path(__file__).resolve().parents[1]
PARAM_KEYS = {"threshold", "min_size", "max_disp_km", "rule", "ws_min"}


def _own_param_dicts(path):
    """Dict literals in a file that contain two or more of the tracker parameter names."""
    hits = []
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.Dict):
            keys = {k.value for k in node.keys if isinstance(k, ast.Constant)}
            if len(keys & PARAM_KEYS) >= 2:
                hits.append(node.lineno)
    return hits


def test_no_script_redefines_defaults():
    files = sorted((ROOT / "scripts").glob("*.py")) + [ROOT / "app.py"]
    offenders = {f.name: lines for f in files if (lines := _own_param_dicts(f))}
    assert not offenders, f"define parameters only in pipeline/tracker.DEFAULTS, found copies at {offenders}"


def test_run_signature_matches_defaults():
    sig = inspect.signature(tracker.run)
    assert {k: sig.parameters[k].default for k in tracker.DEFAULTS} == tracker.DEFAULTS


def test_defaults_are_the_frozen_values():
    assert tracker.DEFAULTS == {"threshold": 2.0, "min_size": 6, "max_disp_km": 400.0,
                                "rule": "ws_and_msl", "ws_min": 17.0}
