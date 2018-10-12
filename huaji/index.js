const glob = require('glob')
const fs = require('fs')
const shelljs = require('shelljs')
const chalk = require('chalk')
var babel = require('@babel/core')

const exists = fs.existsSync

function FangTianHuaJi() {
  this.cssJs = `import './index.css'\nimport '../../style/index.css'`
  this.babelrc = `
  {\n
    \t"presets": ["@babel/preset-env", "@babel/preset-react"],\n
    \t"plugins": ["@babel/plugin-transform-runtime"],\n
    \t"exclude": "node_modules/**"\n
  }
    `
}

FangTianHuaJi.prototype.excute = function() {
  /**
   * Simple copy the index.js into root of es file,
   * in order to use babel-plugin-import
   */
  if (!exists('sep/es')) {
    shelljs.mkdir('-p', 'sep/es')
    shelljs.cp('src/components/index.js', 'sep/es/index.js')
  }

  /**
   * When npm run dev, we don't use the .babelrc of Sep,
   * But when we build the Sep, we have to use it,
   * so just create one when start to build the project.
   */
  if (!exists('.babelrc')) {
    shelljs.touch('.babelrc')
    fs.writeFileSync('.babelrc', this.babelrc, err => {
      err && console.log(chalk.red(err))
    })
  }

  /**
   * Make sure when a project import one of the
   * components with css, the project imports css
   * of the component's own css and the common css,
   * so create a css.js into every component dist folder's
   * child style, and write {this.cssJs} to it.
   * In some cases, the project built with less and use
   * modifyVars with less-loader, which is a global
   * variables in a object, so we have to keep our
   * less source to the dist file
   */
  glob.sync('src/components/*/style/{*.tsx,*.less}').forEach(path => {
    const isLess = /.less$/.test(path)
    const cssOutputDir = `${path
      .replace(/^src/, 'sep')
      .replace(/components/, 'es')
      .split('/')
      .splice(0, 4)
      .join('/')}`
    const cssOutputPath = `${cssOutputDir}/css.js`

    if (!exists(cssOutputDir)) {
      shelljs.mkdir('-p', cssOutputDir)
    }
    if (!exists(cssOutputPath)) {
      shelljs.touch(`${cssOutputPath}`)
      fs.writeFileSync(cssOutputPath, this.cssJs, err => {
        err && console.log(chalk.red(err))
      })
    }

    if (isLess) {
      const lessOutputPath = path
        .replace(/^src/, 'sep')
        .replace(/components/, 'es')
      shelljs.cp(path, lessOutputPath)
    }
  })

  /**
   * Keep less files in style folder, the reason is
   * same as above
   */
  glob.sync('src/components/style/**/*.less').forEach(path => {
    const lessOutputPath = path
      .replace(/^src/, 'sep')
      .replace(/components/, 'es')
    const len = lessOutputPath.split('/').length
    const lessOutputDir = lessOutputPath
      .split('/')
      .splice(0, len - 1)
      .join('/')
    if (!exists(lessOutputDir)) {
      shelljs.mkdir('-p', lessOutputDir)
    }
    shelljs.cp(path, lessOutputPath)
  })
}

/**
 * Keep .tsx files which loads less files into
 * sep folder.
 * In lib version, transform import into require
 * with babel.transformFile
 * And then copy package.json and package-lock.json
 * to sep folder.
 */
FangTianHuaJi.prototype.tail = function() {
  glob.sync('src/components/**/index.tsx').forEach(path => {
    const reg = new RegExp(/style/)
    const isStyle = reg.test(path.split('/')[3]) || reg.test(path.split('/')[2])

    if (!isStyle) return

    fs.readFile(path, (err, data) => {
      const outputPath = path
        .replace(/^src/, 'sep')
        .replace(/components/, 'es')
        .replace(/.tsx$/, '.js')
      err && console.log(chalk.red(err))
      fs.writeFileSync(outputPath, data)
    })

    // lib version
    babel.transformFile(path, {}, function(err, result) {
      const outputPath = path
        .replace(/^src/, 'sep')
        .replace(/components/, 'lib')
        .replace(/.tsx$/, '.js')
      err && console.log(chalk.red(err))
      fs.writeFileSync(outputPath, result.code)
    })
  })
  shelljs.cp('./package.json', './sep/package.json')
  shelljs.cp('./package-lock.json', './sep/package-lock.json')
  shelljs.rm('-f', '.babelrc')
}

FangTianHuaJi.prototype.clear = function() {
  shelljs.rm('-rf', 'sep')
}

const fangTianHuaJi = new FangTianHuaJi()
module.exports = {
  FangTianHuaJi
}
