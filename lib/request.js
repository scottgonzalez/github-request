var https = require("https");
var userAgent = "Node GitHub Request " + require( "../package.json" ).version;

function extend(a, b) {
	for (var prop in b) {
		a[prop] = b[prop];
	}

	return a;
}

function xHeader(str) {
	if (str.substring(0, 2) === "x-" ) {
		str = str.substring(2);
	}

	return str.replace(/-([a-z])/g, function(all, letter) {
		return letter.toUpperCase();
	});
}

function request(settings, data, callback) {
	if (typeof data === "function") {
		callback = data;
		data = null;
	} else {
		data = JSON.stringify(data);
	}
	callback = callback || function() {};

	var headers = extend({
		"user-agent": userAgent,
		"content-length": typeof data === "string" ? data.length : 0
	}, settings.headers || {});
	delete settings.headers;

	var req = https.request(extend({
		host: "api.github.com",
		headers: headers
	}, settings), function(res) {
		var meta = {};
		Object.keys(res.headers).forEach(function(header) {
			if (/^(x-(ratelimit|github))/.test(header)) {
				meta[xHeader(header)] = res.headers[header];
			} else if (header === "link") {
				var links = res.headers.link.split(/,\s*/);
				meta.links = {};
				links.forEach(function(link) {
					var parts = /<([^>]+)>;\s*rel="([^"]+)"/.exec(link);
					meta.links[parts[2]] = parts[1];
				});
			}
		});

		var response = "";
		res.setEncoding("utf8");
		res.on("data", function(chunk) {
			response += chunk;
		});

		res.on("end", function() {
			if (res.statusCode >= 400) {
				var message;
				if (res.headers["content-type"].indexOf("json") !== -1) {
					message = JSON.parse(response).message;
				} else {
					message = response;
				}
				if (!message && res.statusCode === 403) {
					message = "Forbidden";
				}
				callback(new Error(message));
			} else {
				callback(null, JSON.parse(response), meta);
			}
		});
	});

	if (data) {
		req.write(data);
	}

	req.end();
};

module.exports = {
	request: request
};
