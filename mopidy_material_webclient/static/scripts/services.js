var services = angular.module('mopServices', []);

services.factory('mopidy', ['$q',
    function ($q) {
        var mopidy = new Mopidy();
        return $q(function(resolve, reject) {
            mopidy.on("state:online", function() {
                resolve(mopidy);
            });
        });
    }]);

services.factory('lastfm', [
    '$q', '$http',
    function ($q, $http) {
        var key = '2b640713cdc23381c5fb5fc3ef65b576';
        var lastfm = {
            getAlbum: function (album) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=" + key
                    + "&artist=" + encodeURIComponent(album.artists[0].name)
                    + "&album=" + encodeURIComponent(album.name)
                    + "&format=json");
            },
            getArtist: function (artist) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=" + key
                    + "&artist=" + encodeURIComponent(artist.name)
                    + "&format=json");
            },
            getTrack: function(track) {
                return $http.get("http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=" + key 
                    + "&artist=" + encodeURIComponent(track.artists[0].name)
                    + "&track=" + encodeURIComponent(track.name)
                    + "&format=json");
            }
        };

        return lastfm;
    }
]);