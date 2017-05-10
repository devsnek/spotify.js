const snekfetch = require('snekfetch');
const querystring = require('querystring');

class Spotify {
  constructor() {
    this.port = 4370;
    this.csrf = null;
    this.oauth = null;
  }

  init() {
    return this.getLocalPort()
      .then(() => Promise.all([getOauthToken(), this.getCSRF()]))
      .then(([oauth, csrf]) => {
        this.oauth = oauth;
        this.csrf = csrf;
        return this;
      });
  }

  getLocalPort() {
    return new Promise((resolve, reject) => {
      const findLocalSpotify = () => {
        if (this.port > 4380) {
          this.port = 4370;
          reject(new Error('Spotify server was not found in range 4370-4380'));
          return;
        }

        this.getVersion()
        .then(() => resolve(this.port))
        .catch(() => {
          this.port++;
          findLocalSpotify();
        });
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
    return this._request('/simplecsrf/token.json').then((b) => b.token);
  }

  status() {
    return this.runCommand('status');
  }

  open() {
    return this.runCommand('open');
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
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Request timeout')), 1000);
      return snekfetch.get(`https://${randomSpotifySubdomain()}:${this.port}${path}`)
        .set('Origin', 'https://open.spotify.com')
        .then((r) => {
          clearTimeout(timeout);
          resolve(r.body);
        })
        .catch((r) => reject(r.body ? r.body : r));
    });
  }
}

function getOauthToken() {
  return snekfetch.get('https://open.spotify.com/token').then((r) => r.body.t);
}

const ASCII = 'abcdefghijklmnopqrstuvwxyz';
function randomSpotifySubdomain() {
  let subdomain = '';
  while (subdomain.length < 10) subdomain += ASCII[Math.floor(Math.random() * ASCII.length)];
  return `${subdomain}.spotilocal.com`;
}

module.exports = Spotify;
