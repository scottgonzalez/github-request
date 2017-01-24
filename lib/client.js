const https = require('https')
const url = require('url')
const version = require('../package').version

const userAgent = `Node GitHub Request ${version}`

class Client {
  xHeader (str) {
    if (str.substring(0, 2) === 'x-' ) {
      str = str.substring(2)
    }

    return str.replace(/-([a-z])/g, function(all, letter) {
      return letter.toUpperCase()
    })
  }

  request(settings, data, callback) {
    if (typeof data === 'function') {
      callback = data;
      data = null;
    } else {
      data = JSON.stringify(data)
    }
    callback = callback || function() {}

    settings = Object.assign({
      method: "GET"
    }, settings)
    settings.headers = Object.assign({
      'user-agent': userAgent,
      'content-length': typeof data === 'string' ? Buffer.byteLength(data, 'utf8') : 0
    }, settings.headers || {})

    const request = https.request(Object.assign({
      host: 'api.github.com'
    }, settings), (response) => {
      const meta = {}
      Object.keys(response.headers).forEach((header) => {
        if (/^(x-(ratelimit|github))/.test(header)) {
          meta[this.xHeader(header)] = response.headers[header]
        } else if (header === 'link') {
          const links = response.headers.link.split(/,\s*/)
          meta.links = {}
          links.forEach((link) => {
            const parts = /<([^>]+)>;\s*rel="([^"]+)"/.exec(link)
            meta.links[parts[2]] = parts[1]
          })
        }
      })

      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        responseBody += chunk
      })

      response.on('end', () => {
        if (response.statusCode >= 400) {
          let message;

          if (response.headers['content-type'].indexOf('json') !== -1) {
            message = JSON.parse(responseBody).message
          } else {
            message = responseBody
          }

          if (!message && response.statusCode === 403) {
            message = 'Forbidden';
          }

          callback(new Error(message))
        } else {
          callback(null, JSON.parse(responseBody), meta)
        }
      })
    })

    request.on('error', callback)

    if (data) {
      request.write(data)
    }

    request.end()
  }

  requestAll (settings, callback) {
    // Force the request to use a page size of 100 for optimal performance
    const parsed = url.parse(settings.path, true)
    delete parsed.search
    parsed.query.per_page = 100
    settings.path = url.format(parsed)

    this.request(settings, (error, data, meta) => {
      if (error) {
        return callback(error)
      }

      if (!meta.links || !meta.links.next) {
        return callback(null, data, meta)
      }

      settings.path = url.parse(meta.links.next).path
      this.requestAll(settings, (error, nextData, nextMeta) => {
        if (error) {
          return callback(error)
        }

        callback(null, data.concat(nextData), nextMeta)
      })
    })
  }
}

module.exports = Client
