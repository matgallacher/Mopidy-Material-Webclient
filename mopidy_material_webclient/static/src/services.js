var services = angular.module('mopServices', []);

services.factory('mopidy', ['$q',
    function ($q) {
        var mopidy = new Mopidy();
        return $q(function (resolve, reject) {
            mopidy.on("state:online", function () {
                resolve(mopidy);

                mopidy.playback.getCurrentTlTrack()
                    .done(function (tltrack) {
                        mopidy.nowPlaying = tltrack;
                        // TODO: Unsure how to get the current value from a promise, must inventigate
                        updatePageTitle('playing', mopidy.nowPlaying);
                    });

                mopidy.on('event:trackPlaybackStarted', function (e) {
                    mopidy.nowPlaying = e.tl_track.track;
                    updatePageTitle('playing', mopidy.nowPlaying);
                });

                mopidy.on('event:playbackStateChanged', function (e) {
                    updatePageTitle(e.new_state, mopidy.nowPlaying);
                });

                updatePageTitle = function(state, track) {
                    if (typeof track.artists != 'undefined') {
                        var artists = track.artists.map(
                            function(artist){
                                return artist.name;
                            }).join(", ");
                    }

                    var title = '';
                    if (state == 'playing') {
                        title = '\u25B6 ' + track.name + ' - ' + artists + ' | Mopidy';
                    } else if (state == 'paused') {
                        title = '\u2016 ' + track.name + ' - ' + artists + ' | Mopidy';
                    } else {
                        title = 'Mopidy';
                    }

                    document.title = title;
                };

                mopidy.play = function (uri) {
                    mopidy.tracklist.index(mopidy.nowPlaying).then(function (position) {
                        mopidy.tracklist.add(null, position + 1, null, [uri]).then(function (tracks) {
                            mopidy.playback.play(tracks[0]);
                        });
                    });
                };
            });
        });
    }
]);

services.factory('lastfm', [
    '$q', '$http',
    function ($q, $http) {
        var key = '2b640713cdc23381c5fb5fc3ef65b576';
        var lastfm = {
            getAlbum: function (album) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=" + key +
                    "&artist=" + encodeURIComponent(album.artists[0].name) +
                    "&album=" + encodeURIComponent(album.name) +
                    "&format=json");
            },
            getArtist: function (artist) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=" + key +
                    "&artist=" + encodeURIComponent(artist.name) +
                    "&format=json");
            },
            getTrack: function (track) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=" + key +
                    "&artist=" + encodeURIComponent(track.artists[0].name) +
                    "&track=" + encodeURIComponent(track.name) +
                    "&format=json");
            }
        };

        return lastfm;
    }
]);