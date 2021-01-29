// VARIABLES & PATHS

let fileswatch   = 'html,htm,txt,json,md,woff2', // List of files extensions for watching & hard reload (comma separated)
    imageswatch  = 'jpg,jpeg,png,webp,svg', // List of images extensions for watching & compression (comma separated)
	srcDir       = 'src', // Base directory path without «/» at the end
	destDir 	 = 'dist',
    online       = true; // If «false» - Browsersync will work offline without internet connection

let paths = {
	scripts: {
		src: [
			// 'node_modules/jquery/dist/jquery.min.js', // npm vendor example (npm i --save-dev jquery)
			srcDir + '/vendors/jquery-3.5.1.js',
			srcDir + '/js/main.js' // app.js. Always at the end
		],
		dest: destDir + '/assets/js',
	},
	styles: {
		src:  srcDir + '/scss/main.*',
		dest: destDir + '/assets/css',
	},
	images: {
		src:  srcDir + '/images/**/*',
		dest: destDir + '/assets/images',
	},
	deploy: {
		hostname:    'username@yousite.com', // Deploy hostname
		destination: 'yousite/public_html/', // Deploy destination
		include:     [/* '*.htaccess' */], // Included files to deploy
		exclude:     [ '**/Thumbs.db', '**/*.DS_Store' ], // Excluded files from deploy
	},
	fonts: {
		src: srcDir + '/fonts/**/*.{ttf,otf}',
		dest: destDir + '/assets/fonts'
	},
	cssOutputName: 'style.min.css',
	jsOutputName:  'script.min.js',
}

// LOGIC

const { src, dest, parallel, series, watch } = require('gulp');
const scss         = require('gulp-sass');
const cleancss     = require('gulp-clean-css');
const concat       = require('gulp-concat');
const browserSync  = require('browser-sync').create();
const uglify       = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin     = require('gulp-imagemin');
const newer        = require('gulp-newer');
const rsync        = require('gulp-rsync');
const del          = require('del');
//const ttf2woff     = require('gulp-ttf2woff');
//const ttf2woff2    = require('gulp-ttf2woff2');

function browsersync() {
	browserSync.init({
		server: { baseDir: destDir },
		notify: true,
		online: online
	})
}

function scripts() {
	return src(paths.scripts.src)
	.pipe(concat(paths.jsOutputName))
	.pipe(uglify())
	.pipe(dest(paths.scripts.dest))
	.pipe(browserSync.stream())
}

function styles() {
	return src(paths.styles.src)
	.pipe(eval('scss')())
	.pipe(concat(paths.cssOutputName))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } },/* format: 'beautify' */ }))
	.pipe(dest(paths.styles.dest))
	.pipe(browserSync.stream())
}

function images() {
	return src(paths.images.src)
	.pipe(newer(paths.images.dest))
	.pipe(imagemin())
	.pipe(dest(paths.images.dest))
}

function cleanimg() {
	return del('' + paths.images.dest + '/**/*', { force: true })
}

function deploy() {
	return src(srcDir + '/')
	.pipe(rsync({
		root: srcDir + '/',
		hostname: paths.deploy.hostname,
		destination: paths.deploy.destination,
		include: paths.deploy.include,
		exclude: paths.deploy.exclude,
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
}

function startwatch() {
	watch(srcDir  + '/scss/**/*', styles);
	watch(srcDir  + '/images/**/*.{' + imageswatch + '}', images);
	watch(srcDir  + '/**/*.{' + fileswatch + '}').on('change', browserSync.reload);
	watch(srcDir + '/js/**/*.js', scripts);
}

// function woff2() {
// 	return src(paths.fonts.src)
// 		.pipe(ttf2woff2())
// 		.pipe(dest(paths.fonts.dest));
// }

// function woff() {
// 	return src(paths.fonts.src)
//     	.pipe(ttf2woff())
//     	.pipe(dest(paths.fonts.dest));
// }

//exports.fonts	 	= parallel(woff, woff2);
exports.browsersync = browsersync;
exports.assets      = series(cleanimg, styles, scripts, images);
exports.styles      = styles;
exports.scripts     = scripts;
exports.images      = images;
exports.cleanimg    = cleanimg;
exports.deploy      = deploy;
exports.default     = parallel(images, styles, scripts, browsersync, startwatch);
