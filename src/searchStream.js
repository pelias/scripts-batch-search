var util = require('util');
var through = require('through2');
var request = require('requestretry');
const http = require('http');
const https = require('https');

// Base url of service
const host = process.env.URL || 'https://api.geocode.earth';
const url = host + '/v1/search';
// maximum number of HTTP requests in flight
const max_in_flight = process.env.MAX_IN_FLIGHT || 1;
// seconds in between printing of statistics
const stat_delay = process.env.STAT_DELAY || 1;

const non_fallback_layers = ['venue', 'address'];
const non_admin_layers = ['venue', 'address', 'street', 'postalcode'];

const httpLib = url.startsWith('https:') ? https : http;
const agent = new httpLib.Agent({ keepAlive: true, maxSockets: max_in_flight});

const start = new Date();
const stats = {
  processed: 0,
  error: 0,
  zero_results: 0,
  address: 0,
  venue: 0,
  street: 0,
  admin: 0,
  postalcode: 0,
  inFlightCount: 0
};
let last_progress = 0;

function createSearchStream(queryParams) {
  const statInterval = setInterval(function() {
    stats.RPS = (stats.processed - last_progress) / stat_delay;
    console.log(JSON.stringify(stats));
    last_progress = stats.processed;
  }, stat_delay * 1000);

  return through.obj(function (data, enc, next) {
    if (!data.hasOwnProperty('address')) {
      console.log(data);
      return next(new Error('no address column'));
    }

    var self = this;
    stats.inFlightCount++;

    const this_query_params = { };
    this_query_params.text = data.address;
    if (queryParams.api_key) {
      this_query_params.api_key = queryParams.api_key;
    }

    if (!data.address || data.address.length === 0) {
      next();
    }

    var reqOptions = {
      url: url,
      method: 'GET',
      maxAttempts: 10,
      retryDelay: 5000,
      timeout: 10000,
      qs: this_query_params,
      agent: agent
    };

    if (this_query_params.text.length > 300) {
      console.log("warning, text over 100 length");
      console.log(this_query_params.text);
    }

    request(reqOptions, function (err, res, body) {
      stats.processed++;

      if (err || res.statusCode !== 200) {
        if (res) {
          console.log(`${res.statusCode}: ${err ? err.message : res.statusMessage}`);
          if (res.statusCode === 400) {
            console.log(JSON.stringify(this_query_params));
            var resData = JSON.parse(body);
            console.log(JSON.stringify(resData.geocoding.errors));
          }
          self.push(addErrorData(data, (err ? err.message : res.statusMessage)));
        } else {
          console.log("encoutered error with no no res: " + err.message);
          console.log("query params: " + JSON.stringify(this_query_params));
          self.push(addErrorData(data, (err ? err.message : res.statusMessage)));
        }

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
    // essentially this is a busy-wait before the call to next()
    const delay_until_next_attempt_at_return = 1000 / max_in_flight * 2;
    const nextInterval = setInterval(function () {
      if (stats.inFlightCount > max_in_flight / 2) {
        return;
      } else {
        clearInterval(nextInterval)
        next(null);
      }
    }, delay_until_next_attempt_at_return);
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
  data.res_layer = '';
  return data;
}

function addResData(data, resData) {
  data.res_longitude = resData[0].geometry.coordinates[0];
  data.res_latitude = resData[0].geometry.coordinates[1];
  data.res_confidence = resData[0].properties.confidence;
  data.res_label = resData[0].properties.label;
  data.res_layer = resData[0].properties.layer;

  //stats
  const layer = resData[0].properties.layer;

  if (non_admin_layers.includes(layer)) {
    stats[layer]++;
  } else {
    stats.admin++;
  }

  return data;
}

module.exports = createSearchStream;
