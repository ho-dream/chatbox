// eslint-disable max-lines

import path, { dirname } from "node:path";
import { defineConfig } from "@rspack/cli";
import { type Compiler, rspack } from "@rspack/core";
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";
import stdLibBrowser from "node-stdlib-browser";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import { fileURLToPath } from "node:url";
import resolve from "resolve";

export const HTML_REGEX: RegExp = /\.html$/;
export const JS_REGEX: RegExp = /\.(?:js|mjs|cjs|jsx)$/;
export const SCRIPT_REGEX: RegExp = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
export const CSS_REGEX: RegExp = /\.css$/;
export const NODE_MODULES_REGEX: RegExp = /[\\/]node_modules[\\/]/;

const isDev = process.env.NODE_ENV === "development";

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = [
  "last 1 chrome version",
  "last 1 firefox version",
  "last 1 safari version",
];


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SwcLoaderConfig = {
  loader: "builtin:swc-loader",
  options: {
    jsc: {
      externalHelpers: true,
      parser: {
        tsx: true,
        syntax: "typescript",
        decorators: true,
      },
      experimental: {
        cacheRoot: path.join(__dirname, "./node_modules/.cache/.swc"),
        keepImportAttributes: true,
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
        useDefineForClassFields: false,
        react: {
          development: isDev,
          refresh: isDev,
          runtime: "automatic",
        },
      },
    },
    isModule: "unknown",
    env: {
      targets,
      mode: undefined,
    },
    exclude: ["node_modules"],
  },
};

const CssLoaderConfigList = [
  rspack.CssExtractRspackPlugin.loader,
  {
    loader: path.join(
      path.dirname(resolve.sync("@rsbuild/plugin-typed-css-modules")),
      "./loader.js"
    ),
    options: {
      importLoaders: 2,
      modules: {
        auto: (resourcePath: string, resourceQuery: string) => {
          if (resourcePath.includes("node_modules/")) return false;
          if (resourceQuery.includes("?modules")) return true;
          return resourcePath.includes(".module.");
        },
        namedExport: false,
        exportGlobals: false,
        exportLocalsConvention: "asIs",
        localIdentName: "[path][name]__[local]-[hash:base64:6]",
      },
      sourceMap: true,
    },
  },
  {
    loader: "css-loader",
    options: {
      importLoaders: 2,
      modules: {
        auto: (resourcePath: string, resourceQuery: string) => {
          if (resourcePath.includes("node_modules/")) return false;
          if (resourceQuery.includes("?modules")) return true;
          return resourcePath.includes(".module.");
        },
        namedExport: false,
        exportGlobals: false,
        exportLocalsConvention: "asIs",
        localIdentName: "[path][name]__[local]-[hash:base64:6]",
      },
      sourceMap: true,
    },
  },
  {
    loader: "builtin:lightningcss-loader",
    options: {
      targets,
    },
  },
  {
    loader: "postcss-loader",
    options: {
      implementation: resolve.sync("postcss"),
      postcssOptions: {
        file: path.resolve(__dirname, "./postcss.config.js"),
        options: {
          cwd: __dirname,
          env: isDev ? "development" : "production",
        },
      },
      sourceMap: isDev,
    },
  },
];

// const LessLoaderConfig = {
//   test: /\.less$/,
//   sideEffects: true,
//   resolve: {
//     preferRelative: true,
//   },
//   use: [
//     ...CssLoaderConfigList,
//     {
//       loader: "less-loader",
//       options: {
//         lessOptions: {
//           javascriptEnabled: true,
//           paths: [path.join(__dirname, "./node_modules")],
//         },
//         sourceMap: true,
//         implementation: resolve.sync("less"),
//       },
//     },
//   ],
// };

export default defineConfig(() => {
  const fallback = {
    // https://github.com/Richienb/node-polyfill-webpack-plugin/blob/main/index.js
    assert: stdLibBrowser.assert,
    buffer: stdLibBrowser.buffer,
    console: stdLibBrowser.console,
    constants: stdLibBrowser.constants,
    crypto: stdLibBrowser.crypto,
    domain: stdLibBrowser.domain,
    events: stdLibBrowser.events,
    fs: false,
    http: stdLibBrowser.http,
    https: stdLibBrowser.https,
    os: stdLibBrowser.os,
    path: stdLibBrowser.path,
    punycode: stdLibBrowser.punycode,
    process: stdLibBrowser.process,
    querystring: stdLibBrowser.querystring,
    stream: stdLibBrowser.stream,
    /* eslint-disable camelcase */
    _stream_duplex: stdLibBrowser._stream_duplex,
    _stream_passthrough: stdLibBrowser._stream_passthrough,
    _stream_readable: stdLibBrowser._stream_readable,
    _stream_transform: stdLibBrowser._stream_transform,
    _stream_writable: stdLibBrowser._stream_writable,
    string_decoder: stdLibBrowser.string_decoder,
    /* eslint-enable camelcase */
    sys: stdLibBrowser.sys,
    timers: stdLibBrowser.timers,
    "timers/promises": stdLibBrowser["timers/promises"],
    tty: stdLibBrowser.tty,
    url: stdLibBrowser.url,
    util: stdLibBrowser.util,
    vm: stdLibBrowser.vm,
    zlib: stdLibBrowser.zlib,
  } as const;

  // copy from @rsbuild/plugin-node-polyfill
  class ProtocolImportsPlugin {
    apply(compiler: Compiler) {
      compiler.hooks.normalModuleFactory.tap(
        "NormalModuleReplacementPlugin",
        (nmf) => {
          nmf.hooks.beforeResolve.tap(
            "NormalModuleReplacementPlugin",
            (resource) => {
              if (resource.request.startsWith("node:")) {
                resource.request = resource.request.replace(/^node:/, "");
              }
            }
          );
        }
      );
    }
  }

  return defineConfig({
    target: "web",
    name: "web",
    devtool: isDev ? "cheap-module-source-map" : false,
    context: __dirname,
    mode: isDev ? "development" : "production",
    infrastructureLogging: isDev
      ? {
          appendOnly: false,
          level: "verbose",
        }
      : {
          level: "error",
        },
    watchOptions: {
      ignored: /[\\/](?:\.git|node_modules)[\\/]/,
      aggregateTimeout: 0,
    },
    experiments: {
      // css: true,
      asyncWebAssembly: true,
    },
    output: {
      // devtoolModuleFilenameTemplate: (info) =>
      //   external_node_path_.default.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
      devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]",
      path: path.join(__dirname, "./dist"),
      filename: isDev
        ? "static/js/[name].js"
        : "static/js/[name].[contenthash:8].js",
      chunkFilename: isDev
        ? "static/js/async/[name].js"
        : "static/js/async/[name].[contenthash:8].js",
      publicPath: isDev ? "/" : "./",
      pathinfo: false,
      hashFunction: "xxhash64",
      assetModuleFilename: "static/assets/[name].[contenthash:8][ext]",
      webassemblyModuleFilename: "static/wasm/[hash].module.wasm",
      globalObject: "globalThis",
    },
    resolve: {
      tsConfig: {
        configFile: path.resolve(__dirname, "./tsconfig.json"),
        references: "auto",
      },
      alias: {
        "@swc/helpers": path.dirname(resolve.sync("@swc/helpers/package.json")),
        "@": path.resolve(__dirname, "./src"),
      },
      extensionAlias: {
        ".js": [".ts", ".tsx", ".js"],
        ".jsx": [".tsx", ".jsx"],
      },
      extensions: [
        ".app.ts",
        ".app.tsx",
        ".ts",
        ".tsx",
        ".mjs",
        ".js",
        ".jsx",
        ".json",
      ],
      fallback: {
        ...fallback,
      },
    },
    module: {
      parser: {
        javascript: {
          exportsPresence: "error",
        },
      },
      rules: [
        /* config.module.rule('mjs') */
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        /* config.module.rule('css') */
        {
          test: /\.css$/,
          type: "javascript/auto",
          dependency: {
            not: "url",
          },
          sideEffects: true,
          use: CssLoaderConfigList,
          resolve: {
            preferRelative: true,
          },
        },
        /* config.module.rule('js') */
        {
          test: /\.(?:js|mjs|cjs|ts|mts|cts)$/,
          type: "javascript/auto",
          dependency: {
            not: "url",
          },
          include: [
            {
              and: [
                __dirname,
                {
                  not: /[\\/]node_modules[\\/]/,
                },
              ],
            },
            /\.(?:ts|mts|cts)$/,
            // /[\\/]@rsbuild[\\/]core[\\/]dist[\\/]/,
          ],
          use: [
            /* config.module.rule('js').use('swc') */
            SwcLoaderConfig,
          ],
        },
        /* config.module.rule('jsx') */
        {
          test: /\.(?:jsx|tsx)$/,
          type: "javascript/auto",
          dependency: {
            not: "url",
          },
          include: [
            {
              and: [
                __dirname,
                {
                  not: /[\\/]node_modules[\\/]/,
                },
              ],
            },
            /\.(?:tsx|jsx)$/,
            // /[\\/]@rsbuild[\\/]core[\\/]dist[\\/]/,
          ],
          use: [
            /* config.module.rule('js').use('swc') */
            SwcLoaderConfig,
            // babelLoader,
          ],
        },
        /* config.module.rule('js-data-uri') */
        {
          mimetype: {
            or: ["text/javascript", "application/javascript"],
          },
          use: [
            /* config.module.rule('js-data-uri').use('swc') */
            SwcLoaderConfig,
          ],
          resolve: {
            fullySpecified: false,
          },
        },
        /* config.module.rule('image') */
        {
          test: /\.(?:png|jpg|jpeg|pjpeg|pjp|gif|bmp|webp|ico|apng|avif|tif|tiff|jfif)$/i,
          oneOf: [
            /* config.module.rule('image').oneOf('image-asset-url') */
            {
              type: "asset/resource",
              resourceQuery: /(__inline=false|url)/,
              generator: {
                filename: "static/image/[name].[contenthash:8][ext]",
              },
            },
            /* config.module.rule('image').oneOf('image-asset-inline') */
            {
              type: "asset/inline",
              resourceQuery: /inline/,
            },
            /* config.module.rule('image').oneOf('image-asset') */
            {
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 4096,
                },
              },
              generator: {
                filename: "static/image/[name].[contenthash:8][ext]",
              },
            },
          ],
        },
        /* config.module.rule('media') */
        {
          test: /\.(?:mp4|webm|ogg|mov|mp3|wav|flac|aac|m4a|opus)$/i,
          oneOf: [
            /* config.module.rule('media').oneOf('media-asset-url') */
            {
              type: "asset/resource",
              resourceQuery: /(__inline=false|url)/,
              generator: {
                filename: "static/media/[name].[contenthash:8][ext]",
              },
            },
            /* config.module.rule('media').oneOf('media-asset-inline') */
            {
              type: "asset/inline",
              resourceQuery: /inline/,
            },
            /* config.module.rule('media').oneOf('media-asset') */
            {
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 4096,
                },
              },
              generator: {
                filename: "static/media/[name].[contenthash:8][ext]",
              },
            },
          ],
        },
        /* config.module.rule('font') */
        {
          test: /\.(?:woff|woff2|eot|ttf|otf|ttc)$/i,
          oneOf: [
            /* config.module.rule('font').oneOf('font-asset-url') */
            {
              type: "asset/resource",
              resourceQuery: /(__inline=false|url)/,
              generator: {
                filename: "static/font/[name].[contenthash:8][ext]",
              },
            },
            /* config.module.rule('font').oneOf('font-asset-inline') */
            {
              type: "asset/inline",
              resourceQuery: /inline/,
            },
            /* config.module.rule('font').oneOf('font-asset') */
            {
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 4096,
                },
              },
              generator: {
                filename: "static/font/[name].[contenthash:8][ext]",
              },
            },
          ],
        },
        /* config.module.rule('wasm') */
        {
          test: /\.wasm$/,
          dependency: "url",
          type: "asset/resource",
          generator: {
            filename: "static/wasm/[hash].module.wasm",
          },
        },
        /* config.module.rule('svg') */
        {
          test: /\.svg$/,
          oneOf: [
            /* config.module.rule('svg').oneOf('svg-asset-url') */
            {
              type: "asset/resource",
              resourceQuery: /(__inline=false|url)/,
              generator: {
                filename: "static/svg/[name].[contenthash:8].svg",
              },
            },
            /* config.module.rule('svg').oneOf('svg-asset-inline') */
            {
              type: "asset/inline",
              resourceQuery: /inline/,
            },
            /* config.module.rule('svg').oneOf('svg-react') */
            {
              type: "javascript/auto",
              resourceQuery: /react/,
              use: [
                /* config.module.rule('svg').oneOf('svg-react').use('swc') */
                SwcLoaderConfig,
                /* config.module.rule('svg').oneOf('svg-react').use('svgr') */
                {
                  loader: path.join(
                    path.dirname(resolve.sync("@rsbuild/plugin-svgr")),
                    "./loader.mjs"
                  ),
                  options: {
                    svgo: true,
                    svgoConfig: {
                      plugins: [
                        {
                          name: "preset-default",
                          params: {
                            overrides: {
                              removeViewBox: false,
                            },
                          },
                        },
                        "prefixIds",
                      ],
                    },
                    exportType: "default",
                  },
                },
              ],
            },
            /* config.module.rule('svg').oneOf('svg') */
            {
              type: "javascript/auto",
              issuer: [/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/, /\.mdx$/],
              use: [
                /* config.module.rule('svg').oneOf('svg').use('swc') */
                SwcLoaderConfig,
                /* config.module.rule('svg').oneOf('svg').use('svgr') */
                {
                  loader: "@svgr/webpack",
                  options: {
                    svgo: true,
                    svgoConfig: {
                      plugins: [
                        {
                          name: "preset-default",
                          params: {
                            overrides: {
                              removeViewBox: false,
                            },
                          },
                        },
                        "prefixIds",
                      ],
                    },
                    exportType: "named",
                  },
                },
                /* config.module.rule('svg').oneOf('svg').use('url') */
                {
                  loader: "url-loader",
                  options: {
                    limit: 4096,
                    name: "static/svg/[name].[contenthash:8].svg",
                  },
                },
              ],
            },
            /* config.module.rule('svg').oneOf('svg-asset') */
            {
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: 4096,
                },
              },
              generator: {
                filename: "static/svg/[name].[contenthash:8].svg",
              },
            },
          ],
        },
        // LessLoaderConfig,
      ],
    },
    optimization: {
      minimize: !isDev,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          "lib-axios": {
            test: /node_modules[\\/]axios(-.+)?[\\/]/,
            priority: 0,
            name: "lib-axios",
          },
          react: {
            name: "lib-react",
            test: /node_modules[\\/](?:react|react-dom|scheduler|react-refresh|@rspack[\\/]plugin-react-refresh)[\\/]/,
            priority: 0,
          },
          router: {
            name: "lib-router",
            test: /node_modules[\\/](?:react-router|react-router-dom|history|@remix-run[\\/]router)[\\/]/,
            priority: 0,
          },
        },
      },
      minimizer: isDev
        ? []
        : [
            new rspack.SwcJsMinimizerRspackPlugin(),
            new rspack.LightningCssMinimizerRspackPlugin({
              minimizerOptions: { targets },
            }),
          ],
    },
    devServer: {
      // port: 3001,
      port: "8080",
      compress: true,
      hot: true,
      headers: { "Access-Control-Allow-Origin": "*" },
      static: {
        publicPath: "/",
      },
      historyApiFallback: {
        verbose: true,
      },
      allowedHosts: "auto",
      client: {
        logging: "error",
      },
      open: false,
      setupMiddlewares: (middlewares, _server) => {
        return middlewares;
      },
    },
    plugins: [
      new ProtocolImportsPlugin(),
      new rspack.CssExtractRspackPlugin({
        filename: isDev
          ? "static/css/[name].css"
          : "static/css/[name].[contenthash:8].css",
        chunkFilename: isDev
          ? "static/css/async/[name].css"
          : "static/css/async/[name].[contenthash:8].css",
        ignoreOrder: true,
      }),
      new rspack.HtmlRspackPlugin({
        meta: {
          viewport: "width=device-width, initial-scale=1.0",
        },
        chunks: ["index"],
        inject: "head",
        filename: "index.html",
        template: "./index.html",
        scriptLoading: "defer",
        title: "hoppscotch",
      }),
      new rspack.DefinePlugin({
        "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV),
        "import.meta.env.DEV": isDev,
        "import.meta.env.PROD": !isDev,
        "import.meta.env.BASE_URL": JSON.stringify("/"),
        "import.meta.env.ASSET_PREFIX": JSON.stringify(""),
        "process.env.BASE_URL": JSON.stringify("/"),
        "process.env.ASSET_PREFIX": JSON.stringify(""),
        "process.env.RUNTIME_ENV": JSON.stringify("web"),
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      }),
      new rspack.ProgressPlugin({
        prefix: "app",
      }),
      isDev ? new ReactRefreshPlugin() : null,
      new TsCheckerRspackPlugin({
        typescript: {
          mode: "readonly",
          build: false,
          memoryLimit: 8192,
          configFile: path.join(__dirname, "./tsconfig.json"),
          typescriptPath: resolve.sync("typescript"),
        },
        issue: {
          exclude: [({ file = "" }) => NODE_MODULES_REGEX.test(file)],
        },
        logger: {
          log() {},
          error(message) {
            // eslint-disable-next-line prefer-string-replace-all
            console.error(message.replace(/ERROR/g, "Type Error"));
          },
        },
      }),
    ].filter(Boolean),
    performance: {
      hints: false,
      maxAssetSize: 250000,
      maxEntrypointSize: 250000,
    },
    entry: {
      index: ["./src/index.tsx"],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  });
});
