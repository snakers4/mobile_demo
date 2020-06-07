const path = require('path');
const Dotenv = require('dotenv-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/assets/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[hash].js',
  },
  plugins: [
    new Dotenv(),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ],
  node: {
    fs: 'empty'
  },
  module: {
    rules: [
      {
        test: /opus-media-recorder\/encoderWorker\.js$/,
        loader: 'worker-loader'
      },
      {
        test: /opus-media-recorder\/.*\.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader'
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'postcss-loader',
        ],
      },
    ],
  },

  // Optional for webpack-dev-server
  devServer: {
    watchContentBase: true,
    contentBase: path.resolve(__dirname, 'dist'),
    open: true,
	  compress: true,
    proxy: {
      '/transcribe': {
        target: 'https://api.silero.ai/',
        secure: false,
        changeOrigin: true
      }
    }
  },
};
