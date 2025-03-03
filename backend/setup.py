import os
from pathlib import Path
from setuptools import setup


try:
    long_description = (Path(__file__).parent.parent / "README.md").read_text(
        encoding="utf8"
    )
except FileNotFoundError:
    long_description = "See docs at https://github.com/RichtersFinger/peerChat"


setup(
    version=os.environ.get("VERSION", "0.2.0"),
    name="peerChat",
    description="A minimal self-hosted peer-to-peer chat application.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://pypi.org/project/peerChat/",
    project_urls={"Source": "https://github.com/RichtersFinger/peerChat"},
    python_requires=">=3.10",
    install_requires=[
        "Flask>=3,<4",
        "Flask-SocketIO>=5.4,<6",
        "requests>=2.32,<3",
        "gunicorn",
    ],
    packages=[
        "peer_chat",
        "peer_chat.api",
        "peer_chat.common",
    ],
    package_data={"peer_chat": ["client/**/*", "wsgi.py"]},
    entry_points={
        "console_scripts": [
            "peerChat = peer_chat.app:run",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "Topic :: Communications",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Framework :: Flask",
    ],
)
