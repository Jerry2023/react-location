import fs from 'fs';
import path from 'path';
import terser from '@rollup/plugin-terser';
import dev from 'rollup-plugin-dev';
import clear from 'rollup-plugin-clear';
import filesize from 'rollup-plugin-filesize';
import replace from '@rollup/plugin-replace';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';


const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJsonContent = fs.readFileSync('./package.json', 'utf-8');

// 解析 JSON 字符串为 JavaScript 对象
const pkg = JSON.parse(packageJsonContent);
const { devServerCfg, version } = pkg;

const production = !process.env.ROLLUP_WATCH;

const devPlugins = [dev(devServerCfg)];
const buildPlugins = [filesize()];


function resolve(filePath) {
  return path.join(__dirname, filePath);
}

const banner = '/*!\n' + ` * react-location${version}\n` + ` * (c) 2024-${new Date().getFullYear()} jerry2023\n` + ' */';

const config = [
  {
    file: 'index.esm.js',
    format: 'es',
  },
  {
    file: 'index.global.js',
    format: 'iife',
    name: 'reactLocationInit',
    banner,
    replaceCfg: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    plugins: [terser()],
  },
  {
    file: 'index.cjs.js',
    format: 'cjs',
    banner,
  },
];

function appendInput(inputs) {
  return inputs
    .map(({ input, dir }) => {
      return config.map((out) => {
        return Object.assign(
          {
            input,
            dir,
          },
          out,
        );
      });
    })
    .flat();
}

const inputs = [
  {
    input: resolve('src/index.js'),
    dir: './dist',
  },
];

const inputsConfig = appendInput(inputs);

function createConfig(targets) {
  return targets.map((t) => {
    const { input, file, format, banner, plugins, dir, replaceCfg, name } = t;

    const outputConfig = {
      file: path.join(__dirname, dir, file),
      format,
      banner,
      plugins,
      name: 'reactLocationInit',
    };

    if (name) {
      outputConfig.name = name;
    }

    const config = {
      input: input,
      plugins: [
        clear({
          targets: ['dist'],
        }),
        nodeResolve(),
        ...(production ? buildPlugins : devPlugins),
      ],
      output: outputConfig,
    };

    if (!production) {
      outputConfig.sourcemap = true;
    }

    if (replaceCfg) {
      config.plugins.push(replace(replaceCfg));
    }

    return config;
  });
}

export default createConfig(inputsConfig);
