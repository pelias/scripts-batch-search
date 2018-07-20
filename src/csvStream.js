const csvReader = require('csv-stream');
const csvWriter = require('csv-write-stream');

const delimiter = process.env.DELIMITER || ',';


function createReadStream() {

  var options = {
    delimiter: delimiter,
    endLine: '\n', // default is \n,
    escapeChar: '"', // default is an empty string
    enclosedChar: '"' // default is an empty string
  };

  return csvReader.createStream(options);
}

function createWriteStream() {
  // column headers will be defined by the keys of the first object
  return csvWriter({ separator: delimiter });
}

module.exports = {
  read: createReadStream,
  write: createWriteStream
};
