"""Update-related functionality."""

from typing import Optional
from importlib.metadata import version
import subprocess
import sys
from functools import reduce
from itertools import zip_longest
import re

import requests


PKG_NAME = "peerChat"
CHANGELOG_URL = "https://raw.githubusercontent.com/RichtersFinger/peerChat/refs/heads/main/CHANGELOG.md"


def get_current_version() -> str:
    """Returns version of `peerChat` currently running."""
    return version(PKG_NAME)


def get_installed_version() -> str:
    """Returns version of `peerChat` installed in current environment."""
    result = subprocess.run(
        [sys.executable, "-m", "pip", "show", PKG_NAME],
        check=False,
        capture_output=True,
    )
    if result.returncode != 0 or b"Version:" not in result.stdout:
        return None
    match = re.search(r"Version: (.*)", result.stdout.decode("utf-8"))
    if match is None:
        return None
    return match.groups()[0]


def list_available_versions() -> list[str]:
    """Returns list of available versions of `peerChat`."""
    result = subprocess.run(
        [sys.executable, "-m", "pip", "index", "versions", PKG_NAME],
        check=False,
        capture_output=True,
    )
    if result.returncode != 0 or b"Available versions:" not in result.stdout:
        return []
    try:
        return list(
            map(
                lambda version: version.strip(),
                next(
                    filter(
                        lambda line: "Available versions:" in line,
                        result.stdout.decode("utf-8").splitlines(),
                    ),
                    "Available versions:",
                )
                .split("Available versions:")[1]
                .split(", "),
            )
        )
    # pylint: disable=broad-exception-caught
    except Exception:
        return []


def compare_versions(a: str, b: str) -> bool:
    """
    Returns `True` if `a > b`. `a` and `b` should be semver-strings
    without additional metadata (only MAJOR.MINOR.PATCH). If `a` does
    not match that pattern, returns `False; if `a` does but `b` does not
    match that pattern, returns `True`.
    """
    pattern = r"([0-9]*)\.([0-9]*)\.([0-9]*)"
    vam = re.fullmatch(pattern, a)
    vbm = re.fullmatch(pattern, b)
    if vam is None:
        return False
    if vbm is None:
        return True
    va = vam.groups()
    vb = vbm.groups()
    for vap, vbp in zip_longest(va, vb):
        if vap is None and vbp is not None:
            return False
        if vap is not None and vbp is None:
            return True
        if vap is None and vbp is None:
            return False
        if (len(vap), vap) > (len(vbp), vbp):
            return True
    return False


def get_latest_version(versions: Optional[list[str]] = None) -> Optional[str]:
    """Returns latest available version of `peerChat`."""
    if versions is None:
        versions = list_available_versions()
    if not versions:
        return None
    return reduce(
        lambda a, b: a if compare_versions(a, b) else b,
        versions,
        versions[0],
    )


def fetch_changelog() -> Optional[str]:
    """Returns current changelog of `peerChat` if available."""
    try:
        return requests.get(CHANGELOG_URL, timeout=2).text
    # pylint: disable=broad-exception-caught
    except Exception:
        return None
