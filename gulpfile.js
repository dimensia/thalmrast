
var gulp       = require( 'gulp' ),
    less       = require( 'gulp-less' ),
    livereload = require( 'gulp-livereload' ),
    pdf        = require( 'pdfcrowd' );

gulp.task( 'less', function () {
  gulp
    .src( 'resume.less' )
    .pipe( less({
      strictImports: true,
    }))
    .pipe( gulp.dest( './' ) );
});

gulp.task( 'pdf', function () {

  var client = new pdf.Pdfcrowd( 'mbradley', 'nxS98sZf' );
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

gulp.task( 'default', [ 'watch' ] );

