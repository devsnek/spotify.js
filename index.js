const snekfetch = require('snekfetch');
const querystring = require('querystring');

class Spotify {
  constructor() {
    this.port = 4370;
    this.csrf = null;
    this.oauth = null;
  }

  init() {
    return this.getLocalUrl()
      .then(() => Promise.all([getOauthToken(), this.getCSRF()]))
      .then(([oauth, csrf]) => {
        this.oauth = oauth;
        this.csrf = csrf;
        return this;
      });
  }

  getLocalUrl() {
    return new Promise((resolve, reject) => {
      const findLocalSpotify = () => {
        if (this.port > 4380) return reject('Spotify server was not found in range 4370-4380');
        const url = `https://${randomSpotifyDomain()}.spotilocal.com:${this.port}/`;
        this.getVersion(url)
        .then(() => resolve(url))
        .catch(() => { findLocalSpotify(++this.port); });
      };
      findLocalSpotify();
    });
  }

  getVersion() {
    return this._request('/service/version.json?service=remote');
  }

  runCommand(command, options = {}) {
    if (!this.csrf) return this.init().then(() => this.runCommand(command, options));
    options.csrf = this.csrf;
    options.oauth = this.oauth;
    return this._request(`/remote/${command}.json?${querystring.stringify(options)}`);
  }

  getCSRF() {
    return this._request('/simplecsrf/token.json')
      .then((b) => b.token);
  }

  status() {
    return this.runCommand('status');
  }

  play(uri) {
    if (uri) return this.runCommand('play', { uri });
    else return this.status().then((s) => this.play(s.track.track_resource.uri));
  }

  pause(pause = true) {
    return this.runCommand('pause', { pause });
  }

  unpause() {
    return this.pause(false);
  }

  _request(path) {
    return snekfetch.get(`https://${randomSpotifyDomain()}.spotilocal.com:${this.port}${path}`)
      .set('Origin', 'https://open.spotify.com')
      .then((r) => r.body);
  }
}

function getOauthToken() {
  return snekfetch.get('https://open.spotify.com/token').then((r) => r.body.t);
}

function randomSpotifyDomain() {
  let text = '';
  const ASCII_LOWER_CASE = 'abcdefghijklmnopqrstuvwxyz';
  while (text.length < 10) text += ASCII_LOWER_CASE[Math.floor(Math.random() * ASCII_LOWER_CASE.length)];
  return text;
}

module.exports = Spotify;
