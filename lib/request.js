const https = require('https')
const url = require('url')
const version = require('../package').version

const userAgent = `Node GitHub Request ${version}`

class Client {
  constructor (options) {
    this.authHeader = (options.username && options.token)
      ? 'Basic ' + Buffer.from(`${options.username}:${options.token}`).toString('base64')
      : null
  }

  request(_options) {
    return new Promise((resolve, reject) => {
      const options = Object.assign({
        host: 'api.github.com',
        method: 'GET'
      }, _options)

      const data = options.hasOwnProperty('data') ? JSON.stringify(data) : null
      delete options.data

      const headers = {
        'user-agent': userAgent,
        'content-length': data ? Buffer.byteLength(data, 'utf8') : 0
      }
      if (this.authHeader) {
        headers.authorization = this.authHeader
      }
      options.headers = Object.assign(headers, options.headers || {})

      const request = https.request(options, (response) => {
        const meta = this._parseMeta(response.headers)

        let responseBody = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          responseBody += chunk
        })

        response.on('end', () => {
          if (response.statusCode >= 400) {
            let message = responseBody

            if (response.headers['content-type'].indexOf('json') !== -1) {
              message = JSON.parse(message).message
            }

            if (!message && response.statusCode === 403) {
              message = 'Forbidden'
            }

            const error = new Error(message)
            error.statusCode = response.statusCode
            reject(error)
          } else {
            resolve({ data: JSON.parse(responseBody), meta })
          }
        })
      })

      request.on('error', reject)

      if (data) {
        request.write(data)
      }

      request.end()
    })
  }

  requestAll (_options) {
    const options = Object.assign({}, _options)

    // Force the request to use a page size of 100 for optimal performance
    const parsed = url.parse(options.path, true)
    delete parsed.search
    parsed.query.per_page = 100
    options.path = url.format(parsed)

    return this.request(options)
      .then(({ data, meta }) => {
        if (!meta.links || !meta.links.next) {
          return { data, meta }
        }

        options.path = url.parse(meta.links.next).path
        return this.requestAll(options)
          .then(({ nextData, nextMeta }) => {
            return { data: data.concat(nextData), meta: nextMeta }
          })
      })
  }

  _parseMeta (headers) {
    const meta = {}
    Object.keys(headers).forEach((header) => {
      if (/^(x-(ratelimit|github))/.test(header)) {
        meta[this._xHeader(header)] = headers[header]
      } else if (header === 'link') {
        const links = headers.link.split(/,\s*/)
        meta.links = {}
        links.forEach((link) => {
          const parts = /<([^>]+)>;\s*rel="([^"]+)"/.exec(link)
          meta.links[parts[2]] = parts[1]
        })
      }
    })

    return meta
  }

  _xHeader (str) {
    if (str.substring(0, 2) === 'x-' ) {
      str = str.substring(2)
    }

    return str.replace(/-([a-z])/g, function(all, letter) {
      return letter.toUpperCase()
    })
  }
}

module.exports = Client
