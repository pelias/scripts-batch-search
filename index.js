var fs = require('fs');
var csvStream = require('./src/csvStream');
var searchStream = require('./src/searchStream');
var spy = require('through2-spy');


function search(params, progressCallback, endCallback) {
  if (!params.inputFile || !params.outputFile || !params.queryParams) {
    throw new Error('Invalid parameters! Please provide input file, output file, and Mapzen Search API key');
  }

  var processedSize = 0;

  var progressInterval = setInterval(function () {
    progressCallback(processedSize);
  }, 1000*5);

  var stream = fs.createReadStream(params.inputFile)
    .pipe(csvStream.read())
    .pipe(searchStream(params.queryParams))
    .pipe(spy.obj(function () {
      processedSize++;
    }))
    .pipe(csvStream.write())
    .pipe(fs.createWriteStream(params.outputFile));

  stream.on('finish', function () {
    clearInterval(progressInterval);
    endCallback();
  });
}

module.exports = search;

