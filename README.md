# GitHub Request

Simplified GitHub API requests.

Support this project by [donating on Gittip](https://www.gittip.com/scottgonzalez/).

## About

Low level helper for working with the GitHub API.

## Installation

```sh
npm install github-request
```

## Usage

```js
var github = require("github-request");
github.request({
	path: "/orgs/jquery/repos"
}, function(error, repos) {
	console.log(repos);
});
```

## API

### request(settings, data, callback)

* `settings` (Object): Settings for the HTTPS request.
* `data` (String): Data to pass for POST requests.
* `callback` (`function( error, response )`): A callback to invoke when the API call is complete.
  * `response` (Object): The parsed JSON response.

## License

Copyright 2013 Scott González. Released under the terms of the MIT license.

---

Support this project by [donating on Gittip](https://www.gittip.com/scottgonzalez/).
