var fs = require('fs')
  , colors = require('colors')
  , jsonpath = require('jsonpath').eval
  , util = require('util')
  , argv = require('optimist').argv
require('colorsafeconsole')(console)

console.log(util.inspect(argv, false, null, true))


var t = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
var entries = jsonpath(t,'$..entries[*]')

//console.log(util.inspect(entries[0], false, null, true))
