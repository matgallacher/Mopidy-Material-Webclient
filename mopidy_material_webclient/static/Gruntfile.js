/*global module:false*/
module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            deoendencies: {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components',
                        src: ['angular/*.min.js',
                            'angular-animate/*.min.js',
                            'angular-aria/*.min.js',
                            'angular-route/*.min.js',
                            'angular-material/*.min.js'],
                        dest: 'scripts/',
                        flatten: true
                    },
                    {
                        expand: true,
                        cwd: 'bower_components/angular-material',
                        src: '*.min.css',
                        dest: 'css/'
                    }
                ]
            }
        },
        uglify: {
            options: {
                mangle: false,
                sourceMapIncludeSources: true,
                sourceMap: true
            },
            scripts: {
                files: {
                    'scripts/app.min.js': ['src/*.js'],
                }
            }
        },
        less: {
            'css/app.min.css': 'src/app.less'
        },
        jshint: {
            all: ['gruntfile.js', 'src/*.js']
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['copy', 'uglify', 'less']);

};
