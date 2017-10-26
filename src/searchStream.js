var util = require('util');
var through = require('through2');
var request = require('request');

function createSearchStream(baseUrl, endpoint, queryParams, qps, columns) {

  if (!queryParams.hasOwnProperty('api_key')) {
    throw new Error('Query parameters must at least contain api_key');
  }

  columns = columns || ['address'];
  var inFlightCount = 0;

  return through.obj(function (data, enc, next) {
    // if (!data.hasOwnProperty(columns[0])) {
    //   return next(new Error('expected column not found'));
    // }    

    var self = this;

    inFlightCount++;

    columns.forEach((column) => {
      queryParams[column.mapping] = data[column.column];
    });

    var reqOptions = {
      url: `${baseUrl}/${endpoint}`,
      method: 'GET',
      qs: queryParams
    };

    //console.log(reqOptions);    
    
    request(reqOptions, function (err, res, body) {

      if (err || res.statusCode !== 200) {
        console.error(err || res.statusCode);

        self.push(addErrorData(data, (err ? err.message : res.statusMessage)));
        inFlightCount--;
        return;
      }

      //console.log('got it', inFlightCount);
      
      var resData = JSON.parse(body).features;

      if (resData.length === 0) {
        self.push(addErrorData(data, '0 results'));
        inFlightCount--;
        return;
      }

      self.push(addResData(data, resData));
      inFlightCount--;
    });

    // respect the rate limit and don't push another request sooner than 6 seconds
    setTimeout(function () {
      next(null);
    }, 1000 / qps);

  },
  // don't flush the stream until the last in flight request has been handled
  function (done) {
    var interval = setInterval(function () {
      if (inFlightCount === 0) {
        clearInterval(interval);
        done();
      }
    }, 100);
  });
}

function addErrorData(data, message) {
  data.res_longitude = '';
  data.res_latitude = '';
  data.res_confidence = '';
  data.res_label = 'ERROR: ' + message;
  data.res_layer = '';  
  return data;
}

function addResData(data, resData) {
  data.res_longitude = resData[0].geometry.coordinates[0];
  data.res_latitude = resData[0].geometry.coordinates[1];
  data.res_confidence = resData[0].properties.confidence;
  data.res_label = resData[0].properties.label;
  data.res_layer = resData[0].properties.layer;  
  return data;
}

module.exports = createSearchStream;