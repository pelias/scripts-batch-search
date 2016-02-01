var fs = require('fs');
var search = require('./index');
var log = require('single-line-log').stdout;
var colors = require('colors');

var params = {
  inputFile: process.argv[2] || 'test/input.csv',
  outputFile: process.argv[3] || 'output.csv',
  queryParams: process.argv[4] || 'test/queryParams.json'
};

params.queryParams = JSON.parse(fs.readFileSync(params.queryParams));

search(
  params,
  function (progress) {
    log('Number of requests processed: '.green + progress);
  },
  function () {
    console.log('\nAll done!'.green);
  }
);
