const { join } = require('node:path');

// Note: If you use library-specific PostCSS/Tailwind configuration then you should remove the `postcssConfig` build
// option from your application's configuration (i.e. project.json).
//
// See: https://nx.dev/guides/using-tailwind-css-in-react#step-4:-applying-configuration-to-libraries
const plugins = {
  tailwindcss: {
    config: join(__dirname, 'tailwind.config.js'),
  },
  autoprefixer: {},
  // This plugin will automatically process nested CSS code. Without this plugin, :global {} will not be parsed.
  'postcss-nesting': {},
};

module.exports = {
  plugins,
};
