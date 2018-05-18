var util = require('util');
var through = require('through2');
var request = require('request');
const https = require('http');

const agent = new https.Agent({ keepAlive: true, maxSockets: 80});


const start = new Date();
const stats = {
  processed: 0,
  error: 0,
  zero_results: 0,
  address: 0,
  venue: 0,
  admin: 0,
  inFlightCount: 0
};

function createSearchStream(queryParams) {


  if (!queryParams.hasOwnProperty('api_key')) {
    throw new Error('Query parameters must at least contain api_key');
  }

  const statInterval = setInterval(function() {
    stats.RPS = stats.processed / ( new Date() - start) * 1000;
    console.log(JSON.stringify(stats));
  }, 1 * 1000);

  return through.obj(function (data, enc, next) {
    if (!data.hasOwnProperty('address')) {
      return next(new Error('no address column'));
    }

    var self = this;

    stats.inFlightCount++;


    const this_query_params = {
    };
    this_query_params.text = data.name + ' ' + data.address;

    var reqOptions = {
      url: 'http://internal-a56c85a765acc11e8bebb0e73ead8d1c-196936346.us-east-1.elb.amazonaws.com:3100/v1/search',
      method: 'GET',
      qs: this_query_params,
      agent: agent
    };

    request(reqOptions, function (err, res, body) {
      stats.processed++;

      if (err || res.statusCode !== 200) {
        console.log(`${res.statusCode}: ${err ? err.message : res.statusMessage}`);

        if (res.statusCode === 400) {
          console.log(JSON.stringify(queryParams));
          var resData = JSON.parse(body);
          console.log(JSON.stringify(resData.geocoding.errors));
        }
        self.push(addErrorData(data, (err ? err.message : res.statusMessage)));
        stats.error++;
        stats.inFlightCount--;
        return;
      }

      var resData = JSON.parse(body).features;

      if (resData.length === 0) {
        self.push(addErrorData(data, '0 results'));
        stats.zero_results++;
        stats.inFlightCount--;
        return;
      }

      self.push(addResData(data, resData));
      stats.inFlightCount--;
    });

    // adaptively adjust how quickly we progress through the stream
    const nextInterval = setInterval(function () {
      if (stats.inFlightCount > 200) {
        return;
      } else {
        clearInterval(nextInterval)
        next(null);
      }
    }, 10);

  },
  // don't flush the stream until the last in flight request has been handled
  function (done) {
    var interval = setInterval(function () {
      if (stats.inFlightCount === 0) {
        clearInterval(interval);
        clearInterval(statInterval);
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

  //stats
  if (resData[0].properties.layer == 'address') {
    stats.address++;
  } else if (resData[0].properties.layer == 'venue') {
    stats.venue++;
  } else {
    stats.admin++;
  }

  return data;
}

module.exports = createSearchStream;
