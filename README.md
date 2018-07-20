# Pelias Batch geocoder

This is a basic utility for geocoding CSV files that have address data included. It will parse the file and add coordinate information, which is able to be customized with a variety of input parameters (discussed below). This tool is powered by the [Pelias geocoder](https://github.com/pelias/pelias).

In order to use this tool, you’ll need some knowledge about command line (enough to be able to install node modules and run a script). _New to this?_ There are some [great tutorials available online](https://www.learnenough.com/command-line-tutorial).


## What you'll need

This geocoder requires node.js and npm (which is included in node installs) to run. It’s available for installation here: https://nodejs.org/en/

For the time being, this geocoder only uses CSV files for input and output.

### Instructions
1. Clone this repository and install the node module by entering this code into your command line:

```bash
git clone https://github.com/pelias/scripts-batch-search.git
cd scripts-batch-search
npm install
```

2. Open up your CSV file and make sure your input data is gonna work with our tool! Here’s a [test input](https://github.com/pelias/scripts-batch-search/blob/master/test/input.csv) sample that shows you how the address column should be organized. Notice that the complete address is in ONE column, including the city and state. You might need to concatenate your data columns before running this tool or it won’t work.

3. Create a JSON file called `parameters.json`. This is the query parameters document that will include your API key (if using a hosted instance of Pelias) and other search parameters you might want to include. Here’s an example of parameters:

```javascript
{
  "api_key": "search-xxxxxx",
  "boundary.country": "USA",
  "sources": "openaddresses"
}
```

4. Configure the required, any any optional, environment variables:

```bash
export URL="https://api.geocode.earth" # (REQIRED). URL to a hosted instance of Pelias or your own Pelias installation
export MAX_IN_FLIGHT=10 # or other integer, if you want things to go faster (default is 1)
export DELIMITER=',' # if you need to change the delimiter
```


*Don't set the `text` parameter in the queryParams file, because that will be overwritten with each address in the
input data file.*

5. You're ready to run this script! Open up your command line tool and enter:

```bash
npm run start -- ./file/input.csv ./file/output.csv ./file/parameters.json
```

Once running, the script will update to let you know its progress through the file. Once finished, you should see your output CSV file contain all the data from the input CSV, plus additional columns representing the results. All results columns will be prefixed with res\_ to avoid conflicts. You can see an example of expected output [here](test/expectedOutput.csv)

## Questions?
Questions? Comments? Drop us a line: open a [GitHub issue](https://github.com/pelias/pelias/issues).
