var controllers = angular.module('mopControllers', []);

controllers.controller('AppCtrl', [
    '$scope', '$mdSidenav', '$mdDialog', '$location', 'mopidy', 'lastfm',
    function ($scope, $mdSidenav, $mdDialog, $location, mopidy, lastfm) {
        mopidy.then(function (m) {
            m.playback.getCurrentTrack()
                .done(function (track) {
                    $scope.$apply(function () {
                        $scope.nowPlaying = track;
                        $scope.getInfo($scope.nowPlaying);
                    });
                });

            m.playback.getState()
                .done(function (state) {
                    $scope.$apply(function () {
                        $scope.state = state;
                    });
                });

            m.on(console.log.bind(console));

            m.on('event:playbackStateChanged', function (e) {
                $scope.$apply(function () {
                    $scope.state = e.new_state;
                });
            });

            m.on('event:trackPlaybackStarted', function (e) {
                $scope.$apply(function () {
                    $scope.nowPlaying = e.tl_track.track;
                    $scope.getInfo($scope.nowPlaying);
                });
            });

            m.errback = function (e) {
                console.log(e);
            }

            $scope.play = function () {
                m.playback.play();
            }

            $scope.pause = function () {
                m.playback.pause();
            }

            $scope.$on('$routeChangeSuccess', function () {
                $scope.showNowPlaying = true;
            });

            $scope.$on('showNowPlayingChanged', function (e, args) {
                $scope.showNowPlaying = args;
            });
        });

        $scope.getInfo = function (track) {
            if (!track || track.artists.length == 0) {
                return;
            }
            lastfm.getTrack(track).success(function (trackInfo) {
                var t = trackInfo.track;
                if (!t) {
                    return;
                }

                if (t.album
                    && t.album.image
                    && t.album.image.length > 0) {
                    $scope.nowPlaying.album = t.album;
                    $scope.nowPlaying.album.images = [];
                    for (var i = 0; i < t.album.image.length; i++) {
                        $scope.nowPlaying.album.images.push(t.album.image[i]['#text']);
                    }
                }
            });
        };

        $scope.showNowPlaying = true;

        $scope.goTo = function (path) {
            $location.path(path);
            $mdSidenav('left').toggle();
        };

        $scope.toolbar = {
            "showSearch": false,
            "height": null,
            "seatchText": null
        };

        $scope.toolbar.toggleSearch = function (checkText) {
            if (checkText && $scope.toolbar.searchText && $scope.toolbar.searchText.length > 0) {
                return;
            }

            if (!$scope.toolbar.showSearch) {
                $scope.toolbar.showSearch = true;
                $scope.toolbar.height = "md-tall";
            } else {
                $scope.toolbar.showSearch = false;
                $scope.toolbar.height = null;
            }
        };

        $scope.toolbar.toggleSidenav = function (menuId) {
            $mdSidenav(menuId).toggle();
        };

        $scope.toolbar.doSearch = function () {
            var search = $scope.toolbar.searchText;
            if (search) {
                $location.path('search/' + encodeURIComponent(search));
            }
        };

        $scope.system = function ($event) {

            function DialogController($scope, $mdDialog) {
                $scope.action = function(value) {
                    $mdDialog.hide(value);
                }
                $scope.closeDialog = function () {
                    $mdDialog.cancel();
                }
            };

            $mdDialog.show({
                targetEvent: $event,
                template:
                    '<md-dialog aria-label="List dialog">' +
                    '  <md-dialog-content>' +
                    '    <md-list>' +
                    '      <md-list-item ng-click="action(\'restart\')">' +
                    '        <md-icon class="md-accent">refresh</md-icon><p>Restart</p>' +
                    '      </md-list-item>' +
                    '      <md-list-item ng-click="action(\'restart\')">' +
                    '        <md-icon class="md-accent">info</md-icon><p>About</p>' +
                    '      </md-list-item>' +
                    '      <md-list-item ng-click="action(\'restart\')">' +
                    '        <md-icon>cancel</md-icon><p>Cancel</p>' +
                    '      </md-list-item>' +
                    '    </md-list>' +
                    '  </md-dialog-content>' +
                    '</md-dialog>',
                controller: DialogController
            }).success(function(response) {
                console.log(response);
            });
        };
    }
]);

controllers.controller('LibraryCtrl', [
    '$scope', '$routeParams', '$location', '$window', '$mdBottomSheet', '$sce', 'mopidy', 'lastfm',
    function ($scope, $routeParams, $location, $window, $mdBottomSheet, $sce, mopidy, lastfm) {
        var type = null;
        var uri = null;

        if ($routeParams.type) {
            type = decodeURIComponent($routeParams.type);
        }
        if ($routeParams.uri) {
            uri = decodeURIComponent($routeParams.uri);
        }

        $scope.loading = true;

        mopidy.then(function (m) {
            $scope.mopidy = m;
            m.library.browse(uri).done(
                function (content) {
                    var uris = [];

                    $scope.$apply(function () {
                        $scope.content = content;
                        $scope.loading = false;
                    });

                    for (var i = 0; i < content.length; i++) {
                        if (content[i].type == 'track') {
                            uris.push(content[i].uri);
                        }
                    }

                    if (type) {
                        m.library.getImages(uris).done(function (images) {
                            $scope.$apply(function () {
                                for (var i = 0; i < $scope.content.length; i++) {
                                    var img = images[$scope.content[i].uri];
                                    if (img && img.length > 0) {
                                        $scope.content[i].image = img[0].uri;
                                    }
                                }
                            });
                        });
                    }
                });

            if (type
                && type != 'directory'
                && uri.indexOf('podcast') != 0) {
                m.library.lookup(uri).done(function (info) {
                    $scope.tracks = info;
                    var album;
                    var artist;
                    if (info.length > 0) {
                        album = info[0].album;
                        artist = info[0].artists && info[0].artists.length > 0 ? info[0].artists[0] : null;
                    }

                    for (var i = 1; i < info.length; i++) {
                        var al = info[i].album;
                        if (album && al && al.name != album.name) {
                            album = null;
                        }
                        var ar = info[i].artists && info[i].artists.length > 0 ? info[i].artists[0] : null;
                        if (artist && ar && ar.name != artist.name) {
                            artist = null;
                        }
                    }

                    if (type == 'album' && album) {
                        lastfm.getAlbum(album).success(function (albumInfo) {
                            $scope.albumInfo = albumInfo.album;
                        });
                    }

                    if (type == 'artist' && artist) {
                        lastfm.getArtist(artist).success(function (artistInfo) {
                            $scope.artistInfo = artistInfo.artist;
                        });
                    }
                });
            };

            m.playlists.lookup('m3u:Favourites.m3u').done(function (playlist) {
                if (!playlist) {
                    m.playlists.create('Favourites', 'm3u').done(function (newPlaylist) {
                        $scope.favourites = newPlaylist;
                    });
                } else {
                    $scope.favourites = playlist;
                }
            });
        });

        $scope.asTrusted = function (summary) {
            return $sce.trustAsHtml(summary);
        }

        $scope.showTrackActions = function ($event, track) {

            var child = $scope.$new();

            if ($scope.favourites.tracks) {
                child.isFavourite = $scope.favourites.tracks.some(function (itm) {
                    return itm.uri == track.uri;
                });
            }

            $mdBottomSheet.show({
                templateUrl: 'partials/track-actions.html',
                controller: 'TrackActionsCtrl',
                targetEvent: $event,
                scope: child
            }).then(function (clickedItem) {
                if (clickedItem == 'play-next') {
                    $scope.mopidy.playback.getCurrentTlTrack().done(function (current) {
                        console.log(current);
                        $scope.mopidy.tracklist.index(current).done(function (index) {
                            $scope.mopidy.tracklist.add(null, index + 1, null, [track.uri]);
                        });
                    });
                } else if (clickedItem == 'add-to-queue') {
                    $scope.mopidy.tracklist.add(null, null, null, [track.uri]);
                } else if (clickedItem == 'add-to-favourites') {
                    $scope.addToFavourites(track.uri);
                } else if (clickedItem == 'remove-from-favourites') {
                    $scope.removeFromFavourites(track.uri);
                }
            });
        };

        $scope.addToFavourites = function (uri) {
            $scope.mopidy.library.lookup(uri).done(function (tracks) {
                if (!$scope.favourites.tracks) {
                    $scope.favourites.tracks = tracks;
                } else {
                    $scope.favourites.tracks.push(tracks[0]);
                }
                $scope.mopidy.playlists.save($scope.favourites).done(function (playlist) {
                    $scope.favourites = playlist;
                });
            });
        }

        $scope.removeFromFavourites = function (uri) {
            for (var i = 0; i < $scope.favourites.tracks.length; i++) {
                if ($scope.favourites.tracks[i].uri == uri) {
                    $scope.favourites.tracks.splice(i, 1);
                }
            }
            $scope.mopidy.playlists.save($scope.favourites).done(function (playlist) {
                $scope.favourites = playlist;
            });
        }

        $scope.getFontIcon = function (ref) {
            if (ref.type.toLowerCase() == 'track') {
                return 'fa-music';
            } else {
                if (ref.uri.indexOf('spotify') == 0) {
                    return 'fa-spotify';
                } else if (ref.uri.indexOf('tunein:') == 0) {
                    return 'fa-headphones';
                } else if (ref.uri.indexOf('podcast:') == 0) {
                    return 'fa-rss';
                } else if (ref.uri.indexOf('soundcloud:') == 0) {
                    return 'fa-soundcloud';
                } else {
                    return 'fa-folder-o';
                }
            }
        }

        $scope.goTo = function (ref) {
            if (ref.type != 'track') {
                $location.path('library/' + ref.type + '/' + encodeURIComponent(ref.uri));
            } else {
                $scope.play(ref.uri);
            }
        }

        $scope.play = function (uri) {
            $scope.mopidy.tracklist.clear();
            $scope.mopidy.tracklist.add(null, null, null, [uri]).then(function () {
                $scope.mopidy.playback.play();
            });
        }

        $scope.playAll = function () {
            $scope.mopidy.tracklist.clear();
            var uris = [];
            for (var i = 0; i < $scope.tracks.length; i++) {
                uris.push($scope.tracks[i].uri);
            }
            $scope.mopidy.tracklist.add(null, null, null, uris).then(function () {
                $scope.mopidy.playback.play();
            });
        }

        $scope.back = function () {
            $window.history.back();
        }
    }
]);

controllers.controller('PlaylistsCtrl', [
    '$scope', '$routeParams', '$location', 'mopidy',
    function ($scope, $routeParams, $location, mopidy) {
        var uri = $routeParams.uri;

        mopidy.then(function (m) {
            $scope.mopidy = m;
            if (uri) {
                $scope.isPlaylist = true;
                m.playlists.lookup(uri).done(
                    function (playlist) {
                        $scope.$apply(function () {
                            $scope.playlist = playlist;
                            $scope.content = playlist.tracks;

                            var uris = [];
                            for (var i = 0; i < $scope.content.length && i < 9; i++) {
                                uris.push($scope.content[i].uri);
                            }

                            m.library.getImages(uris).done(function (images) {
                                $scope.$apply(function () {
                                    $scope.images = [];
                                    for (var i = 0; i < uris.length; i++) {
                                        if (images[uris[i]] && images[uris[i]].length > 0) {
                                            $scope.images.push(images[uris[i]][0].uri);
                                        }
                                    }
                                });
                            });
                        });
                    });
            } else {
                m.playlists.refresh().done(function () {
                    m.playlists.asList().done(
                        function (content) {
                            $scope.$apply(function () {
                                $scope.content = content;
                            });
                        });
                });
            }
        });

        $scope.getFontIcon = function (ref) {
            if (ref.uri.indexOf('spotify') == 0) {
                return 'fa-spotify';
            } else if (ref.uri.indexOf('tunein:') == 0) {
                return 'fa-headphones';
            } else if (ref.uri.indexOf('podcast') == 0) {
                return 'fa-rss';
            } else if (ref.uri.indexOf('soundcloud') == 0) {
                return 'fa-soundcloud';
            } else if ($scope.isPlaylist) {
                return 'fa-music';
            } else {
                return 'fa-folder-o';
            }
        }

        $scope.goTo = function (ref) {
            if ($scope.isPlaylist) {
                $scope.mopidy.tracklist.clear();
                $scope.mopidy.tracklist.add(null, null, null, [ref.uri])
                    .then(function () {
                        $scope.mopidy.playback.play();
                    });
            } else {
                $location.path('playlists/' + ref.uri);
            }
        }

        $scope.playAll = function () {
            $scope.mopidy.tracklist.clear().done(function () {
                var uris = [];
                for (var i = 0; i < $scope.content.length; i++) {
                    uris.push($scope.content[i].uri);
                }
                $scope.mopidy.tracklist.add(null, null, null, uris).done(function () {
                    $scope.mopidy.playback.play();
                });
            });
        }
    }
]);

controllers.controller('QueueCtrl', [
    '$scope', '$mdDialog', '$mdToast', 'mopidy', 'lastfm',
    function ($scope, $mdDialog, $mdToast, mopidy, lastfm) {
        mopidy.then(function (m) {

            $scope.mopidy = m;
            m.tracklist.getTlTracks().then(function (tracks) {
                $scope.$apply(function () {
                    $scope.tracks = tracks;
                });

                m.playback.getCurrentTlTrack()
                    .done(function (tltrack) {
                        $scope.$apply(function () {
                            $scope.playing = tltrack;
                            $scope.loading = false;
                            if (tltrack) {
                                $scope.getInfo(tltrack.track);
                            }
                        });
                    });
            });

            m.tracklist.getRandom().done(function (enabled) {
                $scope.$apply(function () {
                    $scope.randomOn = enabled;
                });
            });

            m.tracklist.getRepeat().done(function (enabled) {
                $scope.$apply(function () {
                    $scope.repeatOn = enabled;
                });
            });

            m.on('event:tracklist_changed', function () {
                m.tracklist.getTlTracks().then(function (tracks) {
                    $scope.$apply(function () {
                        $scope.tracks = tracks;
                    });
                });
            });

            m.playback.getState()
                .done(function (state) {
                    $scope.$apply(function () {
                        $scope.state = state;
                    });
                });

            m.on('event:playbackStateChanged', function (e) {
                $scope.$apply(function () {
                    $scope.state = e.new_state;
                });
            });

            m.on('event:trackPlaybackStarted', function (e) {
                $scope.$apply(function () {
                    $scope.playing = e.tl_track;
                    $scope.getInfo($scope.nowPlaying);
                });
            });

            $scope.$emit('showNowPlayingChanged', false);
        });

        $scope.getInfo = function (track) {
            if (!track || track.artists.length == 0) {
                return;
            }
            lastfm.getTrack(track).success(function (trackInfo) {
                var t = trackInfo.track;
                if (!t) {
                    return;
                }

                if (t.album
                    && t.album.image
                    && t.album.image.length > 0) {
                    $scope.playing.track.album = t.album;
                    $scope.playing.track.album.images = [];
                    for (var i = 0; i < t.album.image.length; i++) {
                        $scope.playing.track.album.images.push(t.album.image[i]['#text']);
                    }
                }
            });
        }

        $scope.play = function (track) {
            if ($scope.state == 'playing' && track.tlid == $scope.playing.tlid) {
                $scope.mopidy.playback.pause();
            }
            else {
                $scope.mopidy.playback.play(track);
            }
        }

        $scope.previous = function () {
            $scope.mopidy.playback.previous();
        }

        $scope.next = function () {
            $scope.mopidy.playback.next();
        };

        $scope.toggleRandom = function () {
            $scope.mopidy.tracklist.setRandom(!$scope.randomOn).done(
                function () {
                    $scope.$apply(function () {
                        $scope.randomOn = !$scope.randomOn;
                    });
                });
        }

        $scope.toggleRepeat = function () {
            $scope.mopidy.tracklist.setRepeat(!$scope.repeatOn).done(
                function () {
                    $scope.$apply(function () {
                        $scope.repeatOn = !$scope.repeatOn;
                    });
                });
        }

        $scope.save = function ($event) {
            $mdDialog.show({
                targetEvent: $event,
                parent: angular.element(document.body),
                template:
                  '<md-dialog aria-label="Save playlist" flex="20">' +
                  '  <md-dialog-content>' +
                  '    <h3 class="md-title">New playlist</h3>' +
                  '    <form>' +
                  '      <md-input-container flex>' +
                  '        <label>Name</label>' +
                  '        <input type="text" required ng-model="name"/>' +
                  '      </md-input-container>' +
                  '    </form>' +
                  '  </md-dialog-content>' +
                  '  <div class="md-actions">' +
                  '    <md-button ng-click="cancel()" class="md-primary">' +
                  '      Cancel' +
                  '    </md-button>' +
                  '    <md-button ng-click="save()" class="md-primary">' +
                  '      Create playlist' +
                  '    </md-button>' +
                  '  </div>' +
                  '</md-dialog>',
                controller: SaveDialogController
            }).then(function (name) {
                if (!name) {
                    return;
                }

                $scope.mopidy.playlists.create(name, 'm3u').done(function (newPlaylist) {
                    newPlaylist.tracks = [];
                    for (var i = 0; i < $scope.tracks.length; i++) {
                        newPlaylist.tracks.push($scope.tracks[i].track);
                    }
                    $scope.mopidy.playlists.save(newPlaylist).done(function (playlist) {
                        $mdToast.show(
                          $mdToast.simple()
                            .content('New playlist ' + playlist.name + ' created')
                            .position('bottom')
                            .hideDelay(1500)
                        );
                    });
                });
            });

            function SaveDialogController($scope, $mdDialog) {
                $scope.cancel = function () {
                    $mdDialog.cancel();
                }
                $scope.save = function () {
                    $mdDialog.hide($scope.name);
                }
            }
        }
    }
]);

controllers.controller('SearchCtrl', [
    '$scope', '$routeParams', '$location', 'mopidy',
    function ($scope, $routeParams, $location, mopidy) {
        var query = decodeURIComponent($routeParams.query);
        mopidy.then(function (m) {
            m.library.search({
                'any': query
            }).then(function (results) {

                $scope.albums = [];
                $scope.albumsLoading = true;
                $scope.artists = [];
                $scope.artistsLoading = true;
                $scope.tracks = [];
                $scope.tracksLoading = true;
                var uris = [];

                for (var i = 0; i < results.length; i++) {
                    var library = results[i];

                    $scope.$apply(function () {
                        $scope.albumsLoading = false;
                        if (library.albums) {
                            for (var j = 0; j < library.albums.length; j++) {
                                $scope.albums.push(library.albums[j]);
                            }
                        }

                        $scope.artistsLoading = false;
                        if (library.artists) {
                            for (var j = 0; j < library.artists.length; j++) {
                                $scope.artists.push(library.artists[j]);
                            }
                        }
                    });

                    if (library.tracks) {
                        for (var j = 0; j < library.tracks.length; j++) {
                            uris.push(library.tracks[j].uri);
                            $scope.tracks.push(library.tracks[j]);
                        }
                    }
                }

                if (uris.length > 0) {
                    m.library.lookup(null, uris).then(function (tracks) {
                        $scope.$apply(function () {
                            $scope.tracksLoading = false;
                            for (var i = 0; i < $scope.tracks.length; i++) {
                                var uri = $scope.tracks[i].uri;
                                if (tracks[uri].length > 0) {
                                    $scope.tracks[i] = tracks[uri][0];
                                }
                            }
                        });
                    });
                }

                console.log(results);
            });
        });

        $scope.getFontIcon = function (ref) {
            if (ref.type.toLowerCase() == 'track') {
                return 'fa-music';
            } else {
                if (ref.uri.indexOf('spotify') == 0) {
                    return 'fa-spotify';
                }
                if (ref.uri.indexOf('tunein:') == 0) {
                    return 'fa-headphones';
                }
                if (ref.uri.indexOf('podcast') == 0) {
                    return 'fa-rss';
                } else {
                    return 'fa-folder-o';
                }
            }
        }

        $scope.goTo = function (uri) {
            $location.path('library/' + encodeURIComponent(uri));
        }

        $scope.play = function (uri) {
            mopidy.then(function (m) {
                m.tracklist.clear();
                m.tracklist.add(null, null, uri)
                    .then(function () {
                        m.playback.play();
                    });
            });
        }
    }
]);

controllers.controller('SettingsCtrl', [
    '$scope', '$http', 'mopidy',
    function ($scope, $http, mopidy) {
        $http.get('settings').success(function (settings) {
            console.log(settings);
            for (var key in settings) {
                var value = settings[key];
                if (value == 'true') {
                    settings[key] = true;
                }
                $scope.settings = settings;
                $scope.wifi = $scope.wifi ? $scope.wifi : [];
            }
            if ($scope.wifi.indexOf(settings.network__wifi_network) < 0) {
                $scope.wifi.push(settings.network__wifi_network);
            }
        });

        $http.get('wifi').success(function (networks) {
            $scope.wifi = $scope.wifi ? $scope.wifi : [];
            for (var i = 0; i < networks.length; i++) {
                if ($scope.wifi.indexOf(networks[i].ssid) < 0) {
                    $scope.wifi.push(networks[i].ssid);
                }
            }
        });

        $scope.save = function () {
            $http({
                method: 'POST',
                url: 'settings',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                data: $scope.settings
            }).success(function (response) {
                console.log(response);
            });
        };
    }
]);

controllers.controller('TrackActionsCtrl', function ($scope, $mdBottomSheet) {
    $scope.listItemClick = function (clickedItem) {
        $mdBottomSheet.hide(clickedItem);
    };
});
