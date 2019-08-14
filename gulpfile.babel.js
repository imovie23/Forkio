import { src, dest, watch, series, parallel, lastRun } from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';
import del from 'del';
import debug from 'gulp-debug';
import newer from 'gulp-newer';
import browserSync from "browser-sync";
import notify from 'gulp-notify';
import combiner from 'stream-combiner2';
const combine = combiner.obj;
import rigger from 'gulp-rigger';
import imagemin from 'gulp-imagemin';
import webpack from 'webpack-stream';
import named from 'vinyl-named';
import spritesmith from 'gulp.spritesmith'

const PRODUCTION = yargs.argv.prod;

export const html = () => {
	return src('./src/*.html', /*{since: lastRun(html)}*/)
		// .pipe(newer('dist'))
		.pipe(rigger())
		.pipe(debug({title: 'html'}))
		.pipe(dest('./dist'))
};

const processors = [
	autoprefixer({
		grid: true
	})
];

export const styles = () => {
	return combine(
		src('./src/styles/style.scss'),
			gulpif(!PRODUCTION, sourcemaps.init()),
			sass({outputStyle: 'expanded'}),
			gulpif(PRODUCTION, postcss(processors)),
			gulpif(PRODUCTION, cleanCss({compatibility:'ie8'})),
			gulpif(!PRODUCTION, sourcemaps.write()),
			dest('./dist/styles'),
			server.stream()
	).on('error', notify.onError(function(err) {
		return {
			title: 'Styles Error',
			message: err.message,
			sound: false
		}
	}))
};

export const scripts = () => {
	return src(['./src/js/bundle.js'])
		.pipe(named())
		.pipe(webpack({
			module: {
				rules: [
					{
						test: /\.js$/,
						exclude: /node_modules/,
						use: {
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
								plugins: ['@babel/plugin-transform-runtime']
							}
						}
					}
				]
			},
			mode: PRODUCTION ? 'production' : 'development',
			devtool: !PRODUCTION ? 'inline-source-map' : false,
			output: {
				filename: 'bundle.js'
			},
		}))
		.pipe(dest('./dist/js'));
};

export const clean = () => del(['dist']);

export const images = () => {
	return src(['./src/img/**/*.{jpg,jpeg,png,svg,gif,ico}', '!./src/img/sprite-icons/**.*'])
		.pipe(gulpif(PRODUCTION, imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 5}),
			imagemin.svgo({
				plugins: [
					{removeViewBox: true},
					{cleanupIDs: false}
				]
			})
		])))
		.pipe(dest('./dist/img'));
};

export const sprite = () => {
	const spriteData = src('./src/img/sprite-icons/*.*')
		.pipe(gulpif(PRODUCTION, imagemin()))
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: '_sprite.scss',
			imgPath: '../img/sprite/sprite.png',
			// retinaSrcFilter: './src/img/sprite-icons/*@2x.png',
			// retinaImgName: 'sprite@2x.png',
			// retinaImgPath: '../img/sprite/sprite@2x.png',
			padding: 5
		}));

	return spriteData.pipe(gulpif('*.scss', dest('./src/styles/'), dest('./dist/img/sprite/')))
};


export const fonts = () => {
	return src('./src/fonts/**/*.*')
		.pipe(dest('./dist/fonts'))
};

export const watchForChanges = () => {
	watch('./src/styles/**/*.*', styles);
	watch('./src/**/*.html', series(html, reload));
	watch('./src/img/**/*.{jpg,jpeg,png,svg,gif,ico}', series(images, reload));
	watch('./src/img/sprite-icons/*.*', series(sprite, reload));
	watch('./src/fonts/**/*.*', series(fonts, reload));
	watch('src/js/**/*.js', series(scripts, reload));
};

const server = browserSync.create();
export const serve = done => {
	server.init({
		server: 'dist'
	});

	done();
};
export const reload = done => {
	server.reload();
	done();
};

export const build = series(clean, sprite, parallel(styles, images, html, fonts, scripts));
export const dev = series(build, parallel(watchForChanges, serve));
export default dev;