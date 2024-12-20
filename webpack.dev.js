const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: "eval",
  // output: {
  //   filename: 'bundle.js',
  //   path: path.resolve(__dirname, 'public'),
  //   publicPath: '/'
  // },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    hot: true,
    allowedHosts: 'all',
    historyApiFallback: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new Dotenv({
      safe: true,
      systemvars: true
    })
  ]
});
