require('colorsafeconsole')(console)
var fs = require('fs')
  , colors = require('colors')
  , util = require('util')
  , async = require('async')
  , url = require('url')
  , http = require('http')
  , opt = require('optimist').usage("Usage: $0 [har file]")
    .boolean('l').alias('l','ls').describe('l','Show information about the response data stored for each request in the file')
    .boolean('s').describe('s','Show summary of requests in har file')
    .boolean('p').describe('p','Re-issue the http requests in the har file and inject the response bodies')
    .boolean('h').describe('h','Show help')
  , argv = opt.argv

if (argv.h) {
  opt.showHelp(console.log)
  process.exit()
}

if (argv._.length > 0) {
  var t = fs.readFileSync(argv._[0], 'utf8')
  handleHarString(t)
} else {
  var t = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function(chunk) {
    t+=chunk
  })
  process.stdin.on('end',function() {
    handleHarString(t)
  })
  process.stdin.resume()
}

function populateEntry(entry, callback) {
  console.error(('Start processing ' + entry.request.url).yellow)
  var options = url.parse(entry.request.url)
  var request = http.get(options);
  request.on('response', function (res) {
    var t = []
    res.on('data', function (chunk) {
      t.push(chunk)
    })
    res.on('end',function(){
      //TODO: concat buffers, for now be lazy and assume one
      entry.response.content.text = t[0].toString('base64')
      entry.response.content.encoding = 'base64'
      console.error(('Finish processing ' + entry.request.url).green)
      callback()
    })
  })

  //setTimeout(function(){console.log(('Finish processing' + entry.request.url).green);callback()},2000)
}

function echoEntry(entry) {
  var size = (entry.response.content.text ? (entry.response.content.size+'').blue : '0'.red) + ' / ' + (entry.response.bodySize + ' bytes').magenta
  console.log((entry.response.status + ' ')[statusCodeColor(entry.response.status)] + size + ' ' + entry.response.content.mimeType.cyan + ' ' + entry.request.url)
}

function incOrAdd(map, key) {
  map[key] = map[key] ? map[key] + 1 : 1
}

function handleHarString(str) {
  var obj = JSON.parse(str)
  if (argv.ls) {
    obj.log.entries.forEach(echoEntry)
  } else if (argv.s) {
    var summary = obj.log.entries.reduce(function(memo,item){
      memo.total++
      incOrAdd(memo.host, url.parse(item.request.url).hostname)
      incOrAdd(memo.status, item.response.status)
      return memo
    },{total:0, host:{}, status:{}})

    console.log("Total ".yellow + (summary.total + '').magenta)
    for(var i in summary.status) {
      if (summary.status.hasOwnProperty(i)) {
        console.log(i.green + ' ' +  (summary.status[i] + '').magenta)
      }
    }
    for(var i in summary.host) {
      if (summary.host.hasOwnProperty(i)) {
        console.log(i.cyan + ' ' +  (summary.host[i] + '').magenta)
      }
    }
  } else if (argv.p) {
    async.forEachLimit(obj.log.entries,2,populateEntry,function(err) {
      if (err) throw err
      console.log(JSON.stringify(obj))
    })
  }
}

function statusCodeColor(status) {
  if (status >= 500) {
    return 'red'
  } else if (status >= 400) {
    return 'yellow'
  } else if (status >= 300) {
    return 'blue'
  } else if (status >= 200) {
    return 'green'
  } else {
    return 'white'
  }
}
