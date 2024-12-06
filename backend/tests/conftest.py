"""Common fixtures."""

from pathlib import Path
from shutil import rmtree

import pytest


@pytest.fixture(scope="session", name="tmp")
def _tmp():
    """Set up file_storage"""
    return Path("tests/tmp")


@pytest.fixture(scope="session", autouse=True)
def fs_setup(request, tmp: Path):
    """Set up file_storage"""

    def cleanup():
        """Cleanup tmp-dir."""
        if tmp.is_dir():
            rmtree(tmp)

    cleanup()

    tmp.mkdir(parents=True, exist_ok=True)
    request.addfinalizer(cleanup)
