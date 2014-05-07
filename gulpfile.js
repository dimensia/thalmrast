
var gulp       = require( 'gulp' ),
    less       = require( 'gulp-less' ),
    livereload = require( 'gulp-livereload' );

gulp.task( 'less', function () {
  gulp
    .src( 'resume.less' )
    .pipe( less({
      strictImports: true,
    }))
    .pipe( gulp.dest( './' ) );
});

gulp.task( 'watch', function() {
  var server = livereload();

  gulp.watch( 'resume.less', [ 'less' ] );

  gulp.watch( [ 'resume.css' ] )
    .on( 'change', function( file ) {
      server.changed( file.path );
    });
});

gulp.task( 'default', [ 'watch' ] );

