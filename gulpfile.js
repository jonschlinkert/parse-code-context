'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var eslint = require('gulp-eslint');

gulp.task('coverage', function () {
  return gulp.src('index.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['coverage'], function () {
  return gulp.src('test/test.js')
    .pipe(mocha({reporter: 'spec'}))
    .pipe(istanbul.writeReports());
});

gulp.task('lint', function () {
  return gulp.src('index.js')
    .pipe(eslint())
});

gulp.task('default', ['test', 'lint']);
