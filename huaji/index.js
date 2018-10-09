const glob = require('glob')
const fs = require('fs')
const shelljs = require('shelljs')
const chalk = require('chalk')
var babel = require('@babel/core')

function FangTianHuaJi() {
  this.cssJs = `import './index.css'\nimport '../../style/index.css'`
}

FangTianHuaJi.prototype.excute = function() {
  glob.sync('src/components/*/style/*.tsx').forEach(path => {
    const cssOutputDir = `${path
      .replace(/^src/, 'dist')
      .replace(/components/, 'es')
      .split('/')
      .splice(0, 4)
      .join('/')}`

    const cssOutputPath = `${cssOutputDir}/css.js`

    shelljs.mkdir('-p', cssOutputDir)
    shelljs.touch(`${cssOutputPath}`)

    fs.writeFileSync(cssOutputPath, this.cssJs, err => {
      err && console.log(chalk.red(err))
    })
  })
}

FangTianHuaJi.prototype.tail = function() {
  glob.sync('src/components/**/index.tsx').forEach(path => {
    const reg = new RegExp(/style/)
    const isStyle = reg.test(path.split('/')[3]) || reg.test(path.split('/')[2])

    if (!isStyle) return

    fs.readFile(path, (err, data) => {
      const outputPath = path
        .replace(/^src/, 'dist')
        .replace(/components/, 'es')
        .replace(/.tsx$/, '.js')
      err && console.log(chalk.red(err))
      fs.writeFileSync(outputPath, data)
    })

    // lib version
    babel.transformFile(path, {}, function(err, result) {
      const outputPath = path
        .replace(/^src/, 'dist')
        .replace(/components/, 'lib')
        .replace(/.tsx$/, '.js')
      err && console.log(chalk.red(err))
      fs.writeFileSync(outputPath, result.code)
    })
  })
}

FangTianHuaJi.prototype.clear = function() {
  shelljs.rm('-rf', 'dist')
}

const fangTianHuaJi = new FangTianHuaJi()
module.exports = {
  FangTianHuaJi
}
