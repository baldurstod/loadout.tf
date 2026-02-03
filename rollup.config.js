import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy'
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-import-css';
import image from '@rollup/plugin-image';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const isProduction = process.env.BUILD === 'production';

const BUILD_OPTIONS = [
	{ mode: 2, output: "application_poweruser.js" },
];

if (isProduction) {
	BUILD_OPTIONS.push(
		{ mode: 0, output: "application.js" },
		{ mode: 1, output: "application_supporter.js" },
	);
}

const BUILDS = [];

for (const buildOption of BUILD_OPTIONS) {
	BUILDS.push(
		{
			input: './src/client/ts/application.ts',
			output: {
				file: `./build/client/js/${buildOption.output}`,
				format: 'esm'
			},
			plugins: [
				replace({
					preventAssignment: true,
					__patreon_mode__: buildOption.mode,
					__isProduction__: isProduction,
					__printfulEndpoint__: (isProduction) ? 'https://printful.loadout.tf' : 'https://printful.loadout.localhost:17822',
					__shopEndpoint__: (isProduction) ? 'https://shop.loadout.tf' : 'https://shop.loadout.localhost:17830',
				}),
				css(),
				json({
					compact: true,
				}),
				image(),
				typescript(),
				commonjs({
				}),
				nodeResolve({
					dedupe: ['gl-matrix', 'harmony-ui', 'harmony-browser-utils'],
				}),
				isProduction ? terser() : null,
				copy({
					copyOnce: true,
					targets: [
						{ src: 'src/client/index.html', dest: 'build/client/' },
						{ src: 'src/client/ads.txt', dest: 'build/client/' },
						{ src: 'src/client/img/unusuals/', dest: 'build/client/img/' },
						{ src: 'src/client/img/misc/', dest: 'build/client/img/' },
						{ src: 'src/client/shadertoy/', dest: 'build/client/' },
						{ src: 'src/client/json/', dest: 'build/client/' },
					]
				}),
			],
			onwarn: function onwarn(warning, warn) {
				// Disable circular dependencies in modules
				if (warning.code == 'CIRCULAR_DEPENDENCY' && warning.importer && warning.importer.startsWith('node_modules/')) {
					return;
				}
				warn(warning);
			},
		}
	)
}

export default BUILDS;
