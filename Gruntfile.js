module.exports = function (grunt)
{
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            html: {
                files: 'src/*.html',
                tasks: ['htmlmin']
            },

            js: {
                files: 'src/assets/js/*.js',
                tasks: ['jshint', 'uglify']
            },

            css: {
                files: 'src/assets/css/*.css',
                tasks: ['cssmin']
            }
        },

        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'index.html': 'src/index.html',
                    '404.html': 'src/404.html'
                }
            }
        },

        cssmin: {
            options: {
                banner: '/*! <%= pkg.title %> | Copyright (C) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.homepage %> | Released under the MIT License */\n'
            },
            main: {
                files: {
                    'assets/css/main.css': ['src/assets/css/main.css']
                }
            }
        },

        uglify: {
            options: {
                mangle: false,
                preserveComments: 'some'
            },

            dist: {
                files: [
                    {
                        'assets/js/main.js': ['src/assets/js/main.js'],
                        'assets/js/require.js': ['bower_components/requirejs/require.js'],
                        'assets/js/prettify.js': ['bower_components/google-code-prettify/src/prettify.js']
                    },
                    {
                        expand: true,
                        cwd: 'bower_components/google-code-prettify/src/',
                        src: ['lang-css.js'],
                        dest: 'assets/js/'
                    }
                ]
            }
        },

        jshint: {
            files: ['Gruntfile.js', 'src/assets/js/*.js'],
            options: {
                bitwise: true,
                camelcase: true,
                curly: true,
                eqeqeq: true,
                es3: true,
                forin: true,
                immed: true,
                indent: 4,
                latedef: true,
                noarg: true,
                noempty: true,
                nonew: true,
                quotmark: 'single',
                undef: true,
                unused: true,
                strict: true,
                trailing: true,
                browser: true,
                globals: {
                    jQuery: true,
                    Zepto: true,
                    define: true,
                    module: true,
                    test: true,
                    equal: true,
                    WebFont: true,
                    require: true,
                    requirejs: true
                }
            }
        }
    });

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('build', ['test', 'htmlmin', 'cssmin', 'uglify']);
    grunt.registerTask('default', ['test', 'build']);
};