const Spotify = require('./');

const spotify = new Spotify();

(async function test() {
  await spotify.init();
  await spotify.play('spotify:track:7GhIk7Il098yCjg4BQjzvb');
  const status = await spotify.status();
  console.log(`Playing "${status.track.track_resource.name}" by ${status.track.artist_resource.name}`);
}()).catch(console.error);
