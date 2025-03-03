"""Test module for update-tools."""

import pytest

from peer_chat.common import update


@pytest.mark.parametrize(
    ("va", "vb", "true"),
    [
        ("2.0.0", "1.0.0", True),
        ("1.0.0", "2.0.0", False),
        ("1.1.0", "1.0.0", True),
        ("1.0.0", "1.1.0", False),
        ("1.0.1", "1.0.0", True),
        ("1.0.0", "1.0.1", False),
        ("10.0.0", "2.0.0", True),
        ("2.0.0", "10.0.0", False),
        ("-", "0.0.0", False),
        ("0.0.0", "-", True),
        ("2.0.0.dev0", "1.0.0", False),
        ("1.0.0", "2.0.0.dev0", True),
        ("-2.0.0", "1.0.0", False),
        ("1.0.0", "-2.0.0", True),
    ]
)
def test_update_compare_versions(va, vb, true):
    """Test function `compare_versions`."""
    assert update.compare_versions(va, vb) is true


@pytest.mark.parametrize(
    ("versions", "latest"),
    [
        (["0.0.0", "1.0.0"], "1.0.0"),
        (["a", "1.0.0"], "1.0.0"),
        (["1.0.0", "0.0.0"], "1.0.0"),
    ]
)
def test_update_get_latest_version(versions, latest):
    """Test function `compare_versions`."""
    assert update.get_latest_version(versions) == latest
