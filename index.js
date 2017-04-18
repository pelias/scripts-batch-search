var fs = require('fs');
var csvStream = require('./src/csvStream');
var searchStream = require('./src/searchStream');
var spy = require('through2-spy');


/**
 * @param {object} params
 * @param {string} params.inputFile
 * @param {string} params.outputFile
 * @param {string} params.queryParams
 * @param {array} params.columns
 * @param {*} progressCallback 
 * @param {*} endCallback 
 */
function search(params, progressCallback, endCallback) {
  if (!params.inputFile || !params.outputFile || !params.queryParams) {
    throw new Error('Invalid parameters! Please provide input file, output file, and Mapzen Search API key');
  }

  var processedSize = 0;
  var bbox = { minLat: 99999, maxLat: -99999, minLon: 99999, maxLon: -99999 };

  var progressInterval = setInterval(function () {
    progressCallback('progress', processedSize, bbox);
  }, 500);

  var stream = fs.createReadStream(params.inputFile)
    .pipe(csvStream.read())
    .pipe(searchStream(params.queryParams, params.columns))
    .pipe(spy.obj(function (data) {
      processedSize++;
      bbox.minLat = (data.res_latitude < bbox.minLat) ? data.res_latitude : bbox.minLat;
      bbox.minLon = (data.res_longitude < bbox.minLon) ? data.res_longitude : bbox.minLon;
      bbox.maxLat = (data.res_latitude > bbox.maxLat) ? data.res_latitude : bbox.maxLat;
      bbox.maxLon = (data.res_longitude > bbox.maxLon) ? data.res_longitude : bbox.maxLon;
      progressCallback('row', data, bbox);
    }))
    .pipe(csvStream.write())
    .pipe(fs.createWriteStream(params.outputFile));

  stream.on('finish', function () {
    clearInterval(progressInterval);
    endCallback();
  });
}

module.exports = search;

