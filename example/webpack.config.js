const path = require("path");

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

module.exports = {
  entry: "./index.js",
  mode: "development",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "./lib/t"),
    filename: "index.js",
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["file?name=[name].[ext]"],
      },
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        loader: require.resolve('babel-loader'),
        options: {
          customize: require.resolve(
            'babel-preset-react-app/webpack-overrides'
          ),
          presets: [
            [
              require.resolve('babel-preset-react-app'),
              {
                runtime: 'automatic',
              },
            ],
          ],
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          // See #6846 for context on why cacheCompression is disabled
          cacheCompression: false,
          compact: true,
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"]
  },
  devServer: { contentBase: "./" },
};
