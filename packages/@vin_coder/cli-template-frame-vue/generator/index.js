module.exports = (api, options = {}) => {
  api.render("./template", {});
  api.extendPackage({
    scripts: {
      serve: "pg-cli-service start",
      build: "pg-cli-service build",
    },
    dependencies: {
      vue: "^2.6.10",
      "vue-router": "^3.0.6",
    },
    devDependencies: {
      "vue-template-compiler": "^2.6.10",
    },
    postcss: {
      plugins: {
        autoprefixer: {},
      },
    },
    browserslist: ["> 1%", "last 2 versions"],
  });

  if (options.cssPreprocessor) {
    const deps = {
      sass: {
        sass: "^1.19.0",
        "sass-loader": "^7.1.0",
      },
      "node-sass": {
        "node-sass": "^4.12.0",
        "sass-loader": "^7.1.0",
      },
      "dart-sass": {
        sass: "^1.19.0",
        "sass-loader": "^7.1.0",
      },
      less: {
        less: "^3.0.4",
        "less-loader": "^5.0.0",
      },
      stylus: {
        stylus: "^0.54.5",
        "stylus-loader": "^3.0.2",
      },
    };

    api.extendPackage({
      devDependencies: deps[options.cssPreprocessor],
    });
  }
};
