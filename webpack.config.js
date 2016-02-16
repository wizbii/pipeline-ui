module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'app.js',
    library: 'pu',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader']
      }
    ]
  }
}
