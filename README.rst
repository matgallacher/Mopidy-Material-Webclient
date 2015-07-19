****************************
Mopidy-Material-Webclient
****************************

.. image:: https://img.shields.io/pypi/v/Mopidy-Material-Webclient.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-Material-Webclient/
    :alt: Latest PyPI version

.. image:: https://img.shields.io/pypi/dm/Mopidy-Material-Webclient.svg?style=flat
    :target: https://pypi.python.org/pypi/Mopidy-Material-Webclient/
    :alt: Number of PyPI downloads

A Mopidy web client with an Android Material design feel.

This is a stripped down and slightly tarted up web front end for my own personal use and a few people I make retro 
radios into streaming music players for.  

You won't see the wealth of settings that the brilliant `Mopidy Websettings <https://github.com/woutervanwijk/mopidy-websettings>`_ 
gives you because this was created for people with pre-installed systems who won't be making that level of change. Maybe I'll add in 
some meta settings to say which settings are accessible in a later update!


Installation
============

Install by running::

    pip install Mopidy-Material-Webclient


Configuration
=============

Before starting Mopidy, you must add configuration for
Mopidy-Material-Webclient to your Mopidy configuration file::

    [material-webclient]
	enabled = true
	config_file = /etc/mopidy/mopidy.conf


Project resources
=================

- `Source code <https://github.com/matgallacher/mopidy-material-webclient>`_
- `Issue tracker <https://github.com/matgallacher/mopidy-material-webclient/issues>`_
- `Development branch tarball <https://github.com/matgallacher/mopidy-material-webclient/archive/master.tar.gz#egg=Mopidy-Material-Webclient-dev>`_

Thanks
======

- `Mopidy music server <http://mopidy.com>`_ which this is only a web front end for
- A lot of the original code from the `Pi Musicbox <http://pimusicbox.com>`_ for settings and the orginal SD image I worked from

Changelog
=========

v0.2.1
----------------------------------------

- Added missing files to the pypi distribution

v0.2.0
----------------------------------------

- Reworked searching from the library
- Playing a track now inserts it into the current queue then plays it
- Clear queue function
- Lots of cleanup and linting of scripts

v0.1.0
----------------------------------------

- Initial release.
- Lots of unnecessary files still in there from Bower, I'll add Grunt at some point to strip out the minified versions.
- About and restart don't work at all from the System menu
- Search produces results but you can't do anything with them.  I'm not happy with any of the search mechanic at the moment - so expect to see that entirely revamped.
- Playlist support is really basic, just saving the current queue as a new playlist

