var services = angular.module('mopServices', []);

services.factory('mopidy', ['$q',
    function ($q) {
        var mopidy = new Mopidy({
            webSocketUrl: "ws://musicbox.local:6680/mopidy/ws/"
        });
        return $q(function (resolve, reject) {
            mopidy.on("state:online", function () {
                resolve(mopidy);
            });
        })
    }]);

services.factory('lastfm', [
    '$q', '$http',
    function ($q, $http) {
        var key = '2b640713cdc23381c5fb5fc3ef65b576';
        var lastfm = {
            getAlbum: function (album) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=" + key
                    + "&artist=" + album.artists[0].name
                    + "&album=" + album.name
                    + "&format=json");
            },
            getArtist: function (artist) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=" + key
                    + "&artist=" + artist.name
                    + "&format=json");
            },
            getTrack: function(track) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=" + key 
                    + "&artist=" + track.artists[0].name
                    + "&track=" + track.name
                    + "&format=json");
            }
        };

        return lastfm;
    }
]);