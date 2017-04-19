const Spotify = require('./');

const spotify = new Spotify();

spotify.setVolume(0.5).then(console.log).catch(console.error);
