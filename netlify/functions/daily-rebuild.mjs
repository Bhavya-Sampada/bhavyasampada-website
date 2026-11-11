// Runs once a day and asks Netlify to rebuild the site, so the build picks up
// the newest YouTube videos and Google reviews (the build itself fetches them).
//
// Setup (Netlify dashboard → Site configuration):
//   1. Build & deploy → Build hooks → Add build hook, name it "daily-refresh",
//      branch main. Copy the URL.
//   2. Environment variables → add BUILD_HOOK_URL = that URL.
// Schedule below is 00:30 UTC = 06:00 IST.
export default async () => {
  const url = process.env.BUILD_HOOK_URL;
  if (!url) {
    console.log('daily-rebuild: BUILD_HOOK_URL is not set, nothing to do');
    return new Response('BUILD_HOOK_URL not set', { status: 200 });
  }
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trigger_title: 'Daily feed refresh' }) });
  console.log('daily-rebuild: build hook responded ' + r.status);
  return new Response('triggered ' + r.status, { status: 200 });
};

export const config = { schedule: '30 0 * * *' };
