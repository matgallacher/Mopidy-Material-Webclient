from __future__ import unicode_literals

import re

from setuptools import find_packages, setup


def get_version(filename):
    with open(filename) as fh:
        metadata = dict(re.findall("__([a-z]+)__ = '([^']+)'", fh.read()))
        return metadata['version']


setup(
    name='Mopidy-Material-Webclient',
    version=get_version('mopidy_material_webclient/__init__.py'),
    url='https://github.com/matgallacher/mopidy-material-webclient',
    license='Apache License, Version 2.0',
    author='Mat Gallacher',
    author_email='mat.gallacher@gmail.com',
    description='A Mopidy web client with an Android Material feel',
    long_description=open('README.rst').read(),
    packages=find_packages(exclude=['tests', 'tests.*']),
    zip_safe=False,
    include_package_data=True,
    install_requires=[
        'setuptools',
        'Mopidy >= 1.0',
        'wifi >= 0.3.4'
    ],
    entry_points={
        'mopidy.ext': [
            'material-webclient = mopidy_material_webclient:Extension',
        ],
    },
    classifiers=[
        'Environment :: No Input/Output (Daemon)',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: Apache Software License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 2',
        'Topic :: Multimedia :: Sound/Audio :: Players',
    ],
)
