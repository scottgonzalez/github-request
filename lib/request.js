var https = require("https");
var userAgent = "Node GitHub Request " + require( "../package.json" ).version;

function extend(a, b) {
	for (var prop in b) {
		a[prop] = b[prop];
	}

	return a;
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
				callback(null, JSON.parse(response));
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
