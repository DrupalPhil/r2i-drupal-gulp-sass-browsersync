'use strict';

var importOnce = require('node-sass-import-once'),
  path = require('path');

// #############################
// Edit these paths and options.
// #############################

var options = {};

options.rootPath = {
  theme: __dirname + '/',
};

options.theme = {
  css: options.rootPath.theme + 'css/',
  scss: options.rootPath.theme + 'scss/',
};

// Define the node-sass configuration. The includePaths is critical!
options.scss = {
  importer: importOnce,
  includePaths: [
    options.theme.scss,
    options.rootPath.theme + 'node_modules/support-for/sass',
  ],
  outputStyle: 'expanded',
};

// Define which browsers to add vendor prefixes for.
options.autoprefixer = {};

// If your files are on a network share, you may want to turn on polling for
// Gulp watch. Since polling is less efficient, we disable polling by default.
options.gulpWatchOptions = {};
// options.gulpWatchOptions = {interval: 1000, mode: 'poll'};

// Set the URL used to access the Drupal website under development. This will
// allow Browser Sync to serve the website and update CSS changes on the fly.
options.drupalURL = 'http://myeyedr.lndo.site';

// ################################
// Load Gulp and tools we will use.
// ################################
var gulp = require('gulp'),
  $ = require('gulp-load-plugins')(),
  browserSync = require('browser-sync').create(),
  del = require('del'),
  sass = require('gulp-sass'),
  cleanCSS = require('gulp-clean-css');

var sassFiles = [
  options.theme.scss + '**/*.scss',
  // Do not open Sass partials as they will be included as needed.
  '!' + options.theme.scss + '**/_*.scss',
];

// ################################
// Tasks
// ################################

// Clean CSS files.
gulp.task('purge:css', () => {
  return del([
    options.theme.css + '**/*.css',
    options.theme.css + '**/*.map',
  ], {force: true});
});

// Minify CSS
gulp.task('minify', () => {
  return gulp.src(options.theme.css + '/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest(options.theme.css));
});

// Prepare for production
gulp.task('compile:production', gulp.series('purge:css', () => {
  return gulp.src(sassFiles)
    .pipe(sass(options.scss).on('error', sass.logError))
    .pipe($.autoprefixer(options.autoprefixer))
    .pipe($.size({showFiles: true}))
    .pipe(gulp.dest(options.theme.css));
}));

// Simply Watch, no Browsersync
gulp.task('compile:development', gulp.series('purge:css', () => {
  return gulp.src(sassFiles)
    .pipe($.sourcemaps.init())
    .pipe(sass(options.scss).on('error', sass.logError))
    .pipe($.autoprefixer(options.autoprefixer))
    .pipe($.size({showFiles: true}))
    //.pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(options.theme.css))
    .pipe($.if(browserSync.active, browserSync.stream({match: '**/*.css'})));
}));

// Simply Watch, no Browsersync
gulp.task('scss:watch', () => {
  return gulp.watch(
    options.theme.scss + '**/*.scss',
    options.gulpWatchOptions,
    gulp.series('compile:development'),
  );
});

// Watch with browsersync
gulp.task('browser-sync', gulp.parallel('scss:watch', () => {
  if (!options.drupalURL) {
    return Promise.resolve();
  }
  return browserSync.init({
    proxy: {
      target: options.drupalURL,
    },
    open: false,
    port: 3000,
  });
}));

// Compile for Production, Minify
gulp.task('compile:production:minify', gulp.series('compile:production', 'minify'));

// Compile for Production
gulp.task('compile:production', gulp.series('compile:production'));

// Watch with browsersync
gulp.task('watch:sync', gulp.series('browser-sync'));

// Simply Watch, no Browsersync
gulp.task('watch', gulp.series('scss:watch'));

// The default task.
gulp.task('default', gulp.series('watch'));
