var services = angular.module('mopServices', []);

services.factory('mopidy', ['$q', '$rootScope', '$location', 'settings',
    function ($q, $rootScope, $location, settings) {
        var mopidy = new Mopidy();
        return $q(function (resolve, reject) {
            mopidy.on("state:online", function () {
                mopidy.playback.getCurrentTlTrack()
                    .done(function (tltrack) {
                        mopidy.nowPlaying = tltrack.track;
                        settings.updatePageTitle(tltrack ? 'playing' : 'stopped', mopidy.nowPlaying);
                    });

                mopidy.on('event:trackPlaybackStarted', function (e) {
                    mopidy.nowPlaying = e.tl_track.track;
                    settings.updatePageTitle('playing', mopidy.nowPlaying);
                });

                mopidy.on('event:playbackStateChanged', function (e) {
                    settings.updatePageTitle(e.new_state, mopidy.nowPlaying);
                });

                mopidy.play = function (uri) {
                    mopidy.tracklist.index(mopidy.nowPlaying).then(function (position) {
                        mopidy.tracklist.add(null, position + 1, null, [uri]).then(function (tracks) {
                            mopidy.playback.play(tracks[0]);
                        });
                    });
                };

                resolve(mopidy);
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
                return $http.get("https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=" + key +
                    "&artist=" + encodeURIComponent(album.artists[0].name) +
                    "&album=" + encodeURIComponent(album.name) +
                    "&format=json");
            },
            getArtist: function (artist) {
                return $http.get("https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=" + key +
                    "&artist=" + encodeURIComponent(artist.name) +
                    "&format=json");
            },
            getTrack: function (track) {
                return $http.get("https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=" + key +
                    "&artist=" + encodeURIComponent(track.artists[0].name) +
                    "&track=" + encodeURIComponent(track.name) +
                    "&format=json");
            }
        };

        return lastfm;
    }
]);

services.factory('settings', [
    '$q', '$http', '$rootScope',
    function($q, $http, $rootScope) {
        var settings = null;
        var promise = null;

        var service = {
            get: function() {
                var deferred = $q.defer();

                if(settings) {
                    deferred.resolve(settings);
                }

                if(promise) {
                    return promise;
                }

                $http.get('/material-webclient/settings').success(function (settings) {
                    for (var itm in settings) {
                        if (settings.hasOwnProperty(itm)) {
                            var subitm = settings[itm];
                            for (var key in subitm) {
                                if (subitm.hasOwnProperty(key)) {
                                    if (subitm[key] === 'true') {
                                        subitm[key] = true;
                                    }
                                }
                            }
                        }
                    }

                    deferred.resolve(settings);
                });

                promise = deferred.promise;
                return promise;
            },

            save: function(data) {
                var deferred = $q.defer();

                for (var itm in data) {
                    if (data.hasOwnProperty(itm)) {
                        var subitm = data[itm];
                        for (var key in subitm) {
                            if (subitm.hasOwnProperty(key)) {
                                if (typeof subitm[key] === 'boolean') {
                                    subitm[key] = 'true';
                                }
                            }
                        }
                    }
                }

                $http.post('/material-webclient/settings', data)
                    .success(function (response) {
                        settings = data;

                        $q.resolve();
                    });

                return deferred.promise;
            },

            updatePageTitle: function(state, track) {
                if (track && typeof track.artists != 'undefined') {
                    var artists = track.artists.map(
                        function(artist){
                            return artist.name;
                        }).join(", ");
                }

                var title = null;
                if (state == 'playing') {
                    title = '\u25B6 ' + track.name + ' - ' + artists + ' | Mopidy';
                } else if (state == 'paused') {
                    title = '\u2759\u2759 ' + track.name + ' - ' + artists + ' | Mopidy';
                }

                service.get().then(function(settings) {
                    if(settings['material-webclient'].title) {
                        $rootScope.title = title ? title : settings['material-webclient'].title;
                        $rootScope.heading = settings['material-webclient'].title;
                    } else {
                        $rootScope.title = $location.host;
                        $rootScope.heading = $location.host;
                    }
                });
            }
        }

        return service;
    }
]);
