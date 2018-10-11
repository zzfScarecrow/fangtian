const glob = require('glob')
const fs = require('fs')
const shelljs = require('shelljs')
const chalk = require('chalk')
var babel = require('@babel/core')

const exists = fs.existsSync

function FangTianHuaJi() {
  this.cssJs = `import './index.css'\nimport '../../style/index.css'`
}

FangTianHuaJi.prototype.excute = function() {
  if (!exists('sep/es')) {
    shelljs.mkdir('-p', 'sep/es')
    shelljs.cp('src/components/index.js', 'sep/es/index.js')
  }
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
}

FangTianHuaJi.prototype.clear = function() {
  shelljs.rm('-rf', 'sep')
}

const fangTianHuaJi = new FangTianHuaJi()
module.exports = {
  FangTianHuaJi
}
