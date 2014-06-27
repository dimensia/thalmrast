
'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      dev: {
        options: {
          style: 'expanded',
          compass: false,
          loadPath: 'app/bower_components/bootstrap-sass-official/assets/stylesheets'
        },
        files: {
          'public/styles/network.css': 'app/styles/network.scss'
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'app/scripts/**/*.js',
        'test/**/*.js'
      ]
    },

    watch: {
      sass: {
        files: 'app/styles/{,*/}*.{scss,sass}',
        tasks: ['sass:dev']
      },
      jsTest: {
        files: ['test/client/spec/{,*/}*.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },

    protractor: {
      options: {
        configFile: 'test/protractor_conf.js',
        keepAlive: true
      },
      chrome: {
        options: {
          args: {
            browser: 'chrome'
          }
        }
      }
    },

    mochaTest: {
      options: {
        reporter: 'spec'
      },
      src: ['test/server/**/*.js']
    },

  });

  grunt.registerTask('default', ['watch']);
};

