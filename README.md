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
* `callback` (`function( error, response, meta )`): A callback to invoke when the API call is complete.
  * `response` (Object): The parsed JSON response.
  * `meta` (Object): Metadata from the response headers.

The metadata provided contains information from the following headers:

* `x-ratelimit-*`
* `x-github-*`
* `link`

These headers are parsed into a more friendly format before being passed as the `meta` parameter in the `callback`.

All `x-*` headers have the `x-` prefix removed and the names are changed from dashed form to camel case. For example, `x-ratelimit-remaining` becomes `ratelimitRemaining`.

The `link` header is parsed into the named `rel` values. For example, `<https://api.github.com/resource?page=2>; rel="next"` becomes `{next: "https://api.github.com/resource?page=2"}` and is provided in the `links` property.

## License

Copyright Scott González. Released under the terms of the MIT license.

---

Support this project by [donating on Gittip](https://www.gittip.com/scottgonzalez/).
