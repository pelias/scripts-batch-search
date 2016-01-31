# scripts-batch-search

This is  a very basic utility for geocoding CSV files with address data.

## What you'll need

### Installation
> NOTE: this assumes you already have node.js and npm installed.

```bash
git clone git@github.com:pelias/scripts-batch-search.git
cd scripts-batch-search
npm install
```

### Input Data
CSV file with a column labeled `address`, see the sample input file [here](test/input.csv)


### Query Parameters
JSON file with any query parameters you'd like to use, including the API_KEY

> NOTE: You will need to get your Mapzen Search API_KEY [here](https://mapzen.com/developers)

The query parameters can include anything listed in the [docs](https://mapzen.com/documentation/search/search/)
To see an example, check out the queryParams.json file [here](test/queryParams.json)

Don't set the `text` parameter in the queryParams file, because that will be overwritten with each address in the
input data file. 

```javascript
{
  "api_key": "search-12345",
  "boundary.country": "USA",
  "sources": "openaddresses"
}
```

## You're ready!

```bash
npm run start -- ./input/file/path.csv ./output/file/path.csv ./query/params/path.json
```

You'll see it report how many addresses have been processed so far until it is done.
Once finished, you should see your output CSV file contain all the data from the input CSV,
plus additional columns representing the results. All results columns will be prefixed with `res_` to avoid conflicts.
You can see an example of expected output [here](test/expectedOutput.csv)
