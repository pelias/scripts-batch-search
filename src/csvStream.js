var csvReader = require('csv-stream');
var csvWriter = require('csv-write-stream');


function createReadStream() {

  var options = {
    delimiter: ',', // default is ,
    endLine: '\r', // default is \n,
    escapeChar: '"', // default is an empty string
    enclosedChar: '"' // default is an empty string
  };

  return csvReader.createStream(options);
}

function createWriteStream() {
  // column headers will be defined by the keys of the first object
  return csvWriter();
}

module.exports = {
  read: createReadStream,
  write: createWriteStream
};
