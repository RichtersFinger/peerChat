import os
from setuptools import setup


setup(
    version=os.environ.get("VERSION", "0.0.0"),
    name="peerChat",
    description="A minimal self-hosted p2p chat application.",
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
    ],
    package_data={"peer_chat": ["client/**/*", "wsgi.py"]},
    entry_points={
        "console_scripts": [
            "peerChat = peer_chat.app:run",
        ],
    },
    classifiers=[
        "Development Status :: 2 - Pre-Alpha",
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
