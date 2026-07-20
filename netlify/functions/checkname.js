const { getStore } = require('@netlify/blobs');

// Netlify's automatic Blobs configuration (siteID/token auto-injected)
// doesn't reliably work with this function syntax — a known, widely
// reported Netlify issue, not something specific to this code. Passing
// these explicitly is the reliable fix. Both come from environment
// variables set in the Netlify dashboard (Site settings > Environment
// variables), NOT hardcoded here — see setup notes at the bottom of
// this file for how to generate/set them.
function visitorStore() {
  return getStore({
    name: 'visitors',
    siteID: process.env.NETLIFY_BLOBS_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN
  });
}

// A small fixed pool of valid dev-access passphrases. Anyone who has ONE
// of these unlocks full owner access — there's no way to tell them apart
// or revoke just one individually (no database here, just this file), so
// treat all of them as equally trusted. Plaintext lives here because this
// file itself never reaches a browser; it's fine for it to be readable by
// the server. The client only ever sees hashes of these, never the values.
const DEV_KEYS = [
  'bb1b54-8114df-f2d608',
  '26af8d-b30bd1-da6f6a',
  'ed7b7c-1ee235-5655b0',
  '7b9af0-bf00c5-7bb63b',
  '3cfe4b-477f1f-6a911a'
];

// the very first key is treated as Lillith's own personal one, for
// labeling purposes in the visitor log (owner vs. dev vs. visitor)
const OWNER_PERSONAL_KEY = DEV_KEYS[0];

// devaccess only ever hands out from this subset — excludes the first
// (original/personal) key so it can never accidentally get handed to
// someone else while thinking it's a fresh generated one
const SHAREABLE_DEV_KEYS = DEV_KEYS.slice(1);

function roleForKey(ownerKey) {
  if (ownerKey === OWNER_PERSONAL_KEY) return 'owner';
  if (DEV_KEYS.includes(ownerKey)) return 'dev';
  return 'visitor';
}

function getClientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    (event.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'
  );
}

// logs/updates a per-IP record every time someone submits a name at the
// terminal — recognized or not. this is the only place visitor data is
// written; it never touches the devaccess/listNames tools.
async function logVisitor(ip, name, role) {
  try {
    const store = visitorStore();
    await ensureLaunchMeta(store);
    const key = 'visitor:' + ip;
    const now = new Date().toISOString();

    let record = await store.get(key, { type: 'json' });
    if (!record) {
      record = { ip, firstSeen: now, visitCount: 0, role };
    }

    record.lastSeen = now;
    record.lastName = name || '(blank)';
    record.visitCount = (record.visitCount || 0) + 1;

    // once elevated, stays elevated in the log even if a later visit
    // from the same IP doesn't include a key (e.g. someone else on
    // the same network, or just not re-entering it)
    const rank = { visitor: 0, dev: 1, owner: 2 };
    if (rank[role] > rank[record.role || 'visitor']) {
      record.role = role;
    }

    await store.setJSON(key, record);
  } catch (e) {
    // storage hiccup shouldn't ever break the actual name-check response
  }
}

// sets a one-time "site launch" timestamp on the very first visitor
// ever logged. cheap to read later — avoids scanning every record
// just to answer "how long has this site been up".
async function ensureLaunchMeta(store) {
  try {
    const existing = await store.get('meta:launch', { type: 'text' });
    if (!existing) {
      await store.set('meta:launch', new Date().toISOString());
    }
  } catch (e) {
    // non-critical
  }
}

// public, lightweight: just a count + launch date, no IPs or names.
// used for the boot-banner visitor count and the 'uptime' command.
async function siteStats() {
  const store = visitorStore();
  const launch = (await store.get('meta:launch', { type: 'text' })) || null;
  const { blobs } = await store.list({ prefix: 'visitor:' });
  return { count: blobs.length, launch };
}

async function allVisitors() {
  const store = visitorStore();
  const { blobs } = await store.list({ prefix: 'visitor:' });
  const records = await Promise.all(
    blobs.map(b => store.get(b.key, { type: 'json' }))
  );
  return records
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
}

// Each entry:
//   names: aliases that trigger this entry (matched lowercase)
//   addedIn: version string this entry was introduced in (for listname/newnames)
//   lines: array of lines, each line is an array of {t: text, c: color}
//          color options: 'amber' (default), 'red', 'grey', 'purple'
//   lineDelayMs: optional pause between each line as it prints (default 0)
//   actions: optional, run in order after the lines print
//            { type: 'wait', ms }
//            { type: 'closeTab' }
//            { type: 'setPurpleFlag', ms }   -- next page load goes purple for ms
//   requiresFlag: optional — this entry only fires if the client has
//                 previously been granted this flag by another entry
//   setClientFlag: optional — grants the client this flag once matched
//   ownerOnly / setSessionCookie: same meaning as before
//
// This is the ONLY place the real name list and response text exist.
// This file runs on Netlify's servers and is never sent to a browser.
const NAME_TABLE = [
  { names: ['geoffrey', 'geoff'], addedIn: '0.1', lines: [
    [{ t: 'A MAN OF PHSYCHOLOGY IS WITHIN OUR MIDST? VERY INTERESTING.' }]
  ]},
  { names: ['lillith', 'lills', 'lillithartstuffs'], addedIn: '0.1', lines: [
    [{ t: "THAT ISN'T YOUR TRUE NAME, NOW IS IT?" }]
  ]},
  { names: ['therapist'], addedIn: '0.1', lines: [
    [{ t: "I KNOW IT'S YOU." }]
  ]},
  { names: ['colt'], addedIn: '0.1', lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD. WELCOME, COLTON.' }]
  ]},
  { names: ['colton'], addedIn: '0.1', lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD.' }]
  ]},
  { names: ['eli'], addedIn: '0.1', lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD, ELI.' }]
  ]},
  { names: ['sean'], addedIn: '0.1', lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD, SEAN.' }]
  ]},
  { names: ['nia'], addedIn: '0.1', lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD, NIA.' }]
  ]},
  { names: ['zoie'], addedIn: '0.1', lines: [
    [{ t: "WELL, WELL, WELL. YOU'RE AN " }, { t: 'INTERESTING', c: 'red' }, { t: ' ONE.' }]
  ]},
  { names: ['aven'], addedIn: '0.1', ownerOnly: true, setSessionCookie: true, lines: [
    [{ t: 'my muse.' }]
  ]},
  { names: ['cringus'], addedIn: '0.2.2', ownerOnly: true, setSessionCookie: true, lines: [
    [{ t: 'my muse', c: 'purple' }]
  ]},
  { names: ['mori'], addedIn: '0.1', lines: [
    [{ t: 'WELCOME, CHILD OF THE TREES.' }]
  ]},
  { names: ['izzy', 'luna', 'lena', 'velvet'], addedIn: '0.1', lines: [
    [{ t: 'WELCOME, WELCOME ALL. YOU WILL BE ' }, { t: 'MOST ENTERTAINING', c: 'red' }, { t: '.' }]
  ]},

  // --- 0.2 batch ---

  { names: ['marcy'], addedIn: '0.2', lines: [
    [{ t: "THAT ISN'T YOUR TRUE NAME IS IT, " }, { t: 'MARCELINE?', c: 'red' }]
  ]},
  { names: ['finn'], addedIn: '0.2', lines: [
    [{ t: 'I APPRECIATE YOUR HONESTY. PROCEED.' }]
  ]},
  { names: ['ash'], addedIn: '0.2', requiresFlag: 'seenZender', lineDelayMs: 1600, lines: [
    [{ t: 'haha i remember your purples', c: 'purple' }],
    [{ t: '…What?', c: 'grey' }]
  ]},
  { names: ['mom'], addedIn: '0.2', lines: [
    [{ t: 'HAPPY FAMILY, IS IT NOT?' }]
  ]},
  { names: ['mia'], addedIn: '0.2', lines: [
    [{ t: 'YOU DONT deserve TO BE HERE' }]
  ]},
  { names: ['dad'], addedIn: '0.2', lines: [
    [{ t: 'IT COULD BE happier, COULDNT IT?' }]
  ]},
  { names: ['brian'], addedIn: '0.2', lines: [
    [{ t: 'OLD HABITS NEVER TRULY DIE OUT, ' }, { t: 'd o n t   t h e y?', c: 'red' }]
  ]},
  { names: ['ashlyn', 'lyn'], addedIn: '0.2', lines: [
    [{ t: "you aren't welc o m  e      h e       r    e", c: 'red' }]
  ]},
  { names: ['zender', 'zenderman'], addedIn: '0.2', setClientFlag: 'seenZender', lineDelayMs: 1600, lines: [
    [{ t: "God damnit, don't go DDoSing my server again, Zender!", c: 'grey' }],
    [{ t: 'Uhh, but these packets are harmless!', c: 'purple' }],
    [{ t: "Ugh…WAIT! IT'S GONNA-", c: 'grey' }]
  ], actions: [
    { type: 'wait', ms: 2000 },
    { type: 'setPurpleFlag', ms: 30000 },
    { type: 'closeTab' }
  ]}
];

function allEntriesFiltered(version) {
  const entries = version ? NAME_TABLE.filter(e => e.addedIn === version) : NAME_TABLE;
  const names = [];
  entries.forEach(entry => entry.names.forEach(n => names.push(n)));
  return names.sort((a, b) => a.localeCompare(b));
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'bad request' })
    };
  }

  const ownerKey = (body.ownerKey || '').toString().trim();
  const role = roleForKey(ownerKey);
  const isOwner = role !== 'visitor';

  // public — no owner check. just a count + launch date, safe for anyone.
  if (body.siteStats) {
    const stats = await siteStats();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: true, count: stats.count, launch: stats.launch })
    };
  }

  // owner-only: the last-seen visitor log
  if (body.whoSeen) {
    if (!isOwner) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }
    const visitors = await allVisitors();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: true, visitors })
    };
  }

  // owner-only: hand back a random key from the pool + the URL to use it,
  // so an already-verified device can generate a link to share without
  // giving out their own personal key
  if (body.devAccess) {
    if (!isOwner) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }
    const key = SHAREABLE_DEV_KEYS[Math.floor(Math.random() * SHAREABLE_DEV_KEYS.length)];
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: true, key })
    };
  }

  // owner-only: list known names, optionally filtered to one version, with a total
  if (body.listNames) {
    if (!isOwner) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }
    const version = body.version ? body.version.toString() : null;
    const names = allEntriesFiltered(version);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: true, names, total: names.length, version })
    };
  }

  const name = (body.name || '').toString().trim().toLowerCase();
  const clientFlags = Array.isArray(body.flags) ? body.flags : [];

  await logVisitor(getClientIp(event), name, role);

  const match = NAME_TABLE.find(entry => entry.names.includes(name));

  if (!match) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: false })
    };
  }

  if (match.ownerOnly && !isOwner) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: false })
    };
  }

  if (match.requiresFlag && !clientFlags.includes(match.requiresFlag)) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: false })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      found: true,
      lines: match.lines,
      lineDelayMs: match.lineDelayMs || 0,
      actions: match.actions || [],
      setSessionCookie: !!match.setSessionCookie,
      setClientFlag: match.setClientFlag || null
    })
  };
};

