const { src, dest, series, parallel, watch } = require("gulp")

const del = require("del")
const browserSync = require('browser-sync')

const loadPlugins = require("gulp-load-plugins")
const plugins = loadPlugins() // 自动加载插件

const bs = browserSync.create() // 开发服务器

const cwd = process.cwd() // 返回命令行当前工作目录

let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
};
try {
  const loadConfig = require(`${cwd}/pages.config.js`)  // 后续使用join改写
  config = Object.assign({}, config, loadConfig)
} catch (e) {}

const server = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false, // 右上角提示
    port: 2080,  // 定义端口
    // open: true,  // s是否自动打开浏览器
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src})
          .pipe(plugins.sass({ outputStyle: 'expanded' }))  // expanded 完全展开形式
          .pipe(dest(config.build.temp))
          .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src })
           .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
           .pipe(dest(config.build.temp))
           .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
          .pipe(plugins.swig({ data: config.data, cache: false }))
          .pipe(dest(config.build.temp))
          .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src })
          .pipe(plugins.imagemin())
          .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
          .pipe(plugins.imagemin())
          .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
          .pipe(dest(config.build.dist))
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
          .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
          // html(gulp-htmlmin)、css(gulp-uglify)、js(gulp-clean-css)
          .pipe(plugins.if(/\.js$/, plugins.uglify()))
          .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
          .pipe(plugins.if(/\.html$/, plugins.htmlmin({ 
            collapseWhitespace: true, 
            minifyCSS: true, 
            minifyJS: true 
          })))
          .pipe(dest(config.build.dist))
}

// parallel 同时执行
// series 顺序执行
const compile = parallel(style, script, page)
// 开发阶段
const develop = series(compile, server)
// 上线之前打包
const build = series(clean, parallel(series(compile, useref), image, font, extra))

module.exports = {
  clean,
  build,
  develop
}