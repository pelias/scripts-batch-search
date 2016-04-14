var util = require('util');
var through = require('through2');
var request = require('request');


function createSearchStream(queryParams) {

  if (!queryParams.hasOwnProperty('api_key')) {
    throw new Error('Query parameters must at least contain api_key');
  }

  var inFlightCount = 0;

  return through.obj(function (data, enc, next) {
    var self = this;

    inFlightCount++;

    queryParams.text = [data.Address, data.City, data.State].join(', ');

    var reqOptions = {
      url: 'https://search.mapzen.com/v1/search',
      method: 'GET',
      qs: queryParams
    };

    request(reqOptions, function (err, res, body) {

      if (err || res.statusCode !== 200) {
        self.push(addErrorData(data, (err ? err.message : res.statusMessage)));
        inFlightCount--;
        return;
      }

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
    }, 1000 / 5);

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
  return data;
}

function addResData(data, resData) {
  data.res_longitude = resData[0].geometry.coordinates[0];
  data.res_latitude = resData[0].geometry.coordinates[1];
  data.res_confidence = resData[0].properties.confidence;
  data.res_label = resData[0].properties.label;
  data.res_housenumber = resData[0].properties.housenumber;
  data.res_street = resData[0].properties.street;
  data.res_region = resData[0].properties.region;
  data.res_postalcode = resData[0].properties.postalcode;
  return data;
}

module.exports = createSearchStream;