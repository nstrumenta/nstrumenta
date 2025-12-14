# filepath: setup.py
from setuptools import setup, find_packages

setup(
    name='nstrumenta',
    version='4.0.3',
    packages=find_packages(),
    install_requires=[
        'requests',
    ],
    author='Tyler Bryant',
    author_email='tyler@nstrumenta.com',
    description='A client library for Nstrumenta API',
    long_description=open('readme.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/nstrumenta/nstrumenta',
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
)