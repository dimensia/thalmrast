
var gulp       = require( 'gulp' ),
    less       = require( 'gulp-less' ),
    livereload = require( 'gulp-livereload' ),
    pdf        = require( 'pdfcrowd' ),
    git        = require( 'gulp-git' ),
    seq        = require( 'run-sequence' );

gulp.task( 'less', function () {
  return gulp
    .src( 'resume.less' )
    .pipe( less({
      strictImports: true,
    }))
    .pipe( gulp.dest( './' ) );
});

gulp.task( 'pdf', function () {

  var client = new pdf.Pdfcrowd( 'mbradley', '9a6e836ed8a31f2eb3b6ab8aab2c7a38' );
  client.convertURI(
    'http://thalmrast.com/resume',
    pdf.saveToFile( 'resume.pdf' ),
    {
      use_print_media: true,
      pdf_scaling_factor: 0.8,
      height: -1  // force single page PDF
    });
});

gulp.task( 'watch', function() {
  var server = livereload();

  gulp.watch( 'resume.less', [ 'less' ] );

  gulp.watch( [ 'resume.css' ] )
    .on( 'change', function( file ) {
      server.changed( file.path );
    });
});

gulp.task( 'commit', function() {
  return gulp.src( './git-test/*' )
    .pipe( git.commit( 'build', { args: '-a' } ) );
});

gulp.task( 'upload', [ 'commit' ], function() {
  return git.push()
    .end()
});

gulp.task( 'default', [ 'watch' ] );

gulp.task( 'build', function( cb ) {
  seq( 'less', 'upload', 'pdf', 'upload', cb );
});

