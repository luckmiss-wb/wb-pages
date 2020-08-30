#!/usr/bin/env node
process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) // 对应到 packages.json 里的 main 字段

require('gulp/bin/gulp')