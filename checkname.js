const crypto = require('crypto');

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

// Hash of the owner-unlock passphrase. The passphrase itself lives only
// on Lillith's device (in localStorage after a successful unlock) — it
// is never stored here or anywhere else in this codebase.
const OWNER_UNLOCK_HASH = '337960b05ca2c8c1550e5e7ee82fc1939d7b8593daf1a7016ff5efc178df8cdb';

// Each entry:
//   names: aliases that trigger this entry (matched lowercase)
//   lines: array of lines, each line is an array of {t: text, c: color}
//          color options: 'amber' (default), 'red', 'grey', 'purple'
//   actions: optional, run in order after the lines print
//            { type: 'wait', ms }
//            { type: 'closeTab' }
//            { type: 'setPurpleFlag', ms }  -- next page load goes purple for ms
//   ownerOnly / setSessionCookie: same meaning as before
//
// This is the ONLY place the real name list and response text exist.
// This file runs on Netlify's servers and is never sent to a browser.
const NAME_TABLE = [
  { names: ['geoffrey', 'geoff'], lines: [
    [{ t: 'A MAN OF PHSYCHOLOGY IS WITHIN OUR MIDST? VERY INTERESTING.' }]
  ]},
  { names: ['lillith', 'lills', 'lillithartstuffs'], lines: [
    [{ t: "THAT ISN'T YOUR TRUE NAME, NOW IS IT?" }]
  ]},
  { names: ['therapist'], lines: [
    [{ t: "I KNOW IT'S YOU." }]
  ]},
  { names: ['colt'], lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD. WELCOME, COLTON.' }]
  ]},
  { names: ['colton'], lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD.' }]
  ]},
  { names: ['eli', 'sean', 'nia'], lines: [
    [{ t: 'TRULY, JUST TRULY SOMEBODY WORTH HAVING ON BOARD.' }]
  ]},
  { names: ['zoie'], lines: [
    [{ t: "WELL, WELL, WELL. YOU'RE AN " }, { t: 'INTERESTING', c: 'red' }, { t: ' ONE.' }]
  ]},
  { names: ['aven'], ownerOnly: true, setSessionCookie: true, lines: [
    [{ t: 'my muse.' }]
  ]},
  { names: ['mori'], lines: [
    [{ t: 'WELCOME, CHILD OF THE TREES.' }]
  ]},
  { names: ['izzy', 'luna', 'lena', 'velvet'], lines: [
    [{ t: 'WELCOME, WELCOME ALL. YOU WILL BE ' }, { t: 'MOST ENTERTAINING', c: 'red' }, { t: '.' }]
  ]},

  // --- new batch ---

  { names: ['marcy'], lines: [
    [{ t: "THAT ISN'T YOUR TRUE NAME IS IT, " }, { t: 'FINN?', c: 'red' }]
  ]},
  { names: ['finn'], lines: [
    [{ t: 'I APPRECIATE YOUR HONESTY. PROCEED.' }]
  ]},
  { names: ['ash'], lines: [
    [{ t: 'haha i remember your purples', c: 'purple' }],
    [{ t: '…What?', c: 'grey' }]
  ]},
  { names: ['mom'], lines: [
    [{ t: 'HAPPY FAMILY, IS IT NOT?' }]
  ]},
  { names: ['mia'], lines: [
    [{ t: 'YOU DONT deserve TO BE HERE' }]
  ]},
  { names: ['dad'], lines: [
    [{ t: 'IT COULD BE happier, COULDNT IT?' }]
  ]},
  { names: ['brian'], lines: [
    [{ t: 'OLD HABITS NEVER TRULY DIE OUT, ' }, { t: 'd o n t   t h e y?', c: 'red' }]
  ]},
  { names: ['ashlyn', 'lyn'], lines: [
    [{ t: "you aren't welc o m  e      h e       r    e", c: 'red' }]
  ]},
  { names: ['zender', 'zenderman'], lines: [
    [{ t: "God damnit, don't go DDoSing my server again, Zender!", c: 'grey' }],
    [{ t: 'Uhh, but these packets are harmless!', c: 'purple' }],
    [{ t: "Ugh…WAIT! IT'S GONNA-", c: 'grey' }]
  ], actions: [
    { type: 'wait', ms: 2000 },
    { type: 'setPurpleFlag', ms: 30000 },
    { type: 'closeTab' }
  ]}
];

function allNamesAlphabetical() {
  const all = [];
  NAME_TABLE.forEach(entry => entry.names.forEach(n => all.push(n)));
  return all.sort((a, b) => a.localeCompare(b));
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

  const ownerKey = (body.ownerKey || '').toString();
  const isOwner = ownerKey ? sha256Hex(ownerKey) === OWNER_UNLOCK_HASH : false;

  // owner-only: list every known name, alphabetized
  if (body.listNames) {
    if (!isOwner) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: true, names: allNamesAlphabetical() })
    };
  }

  const name = (body.name || '').toString().trim().toLowerCase();
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

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      found: true,
      lines: match.lines,
      actions: match.actions || [],
      setSessionCookie: !!match.setSessionCookie
    })
  };
};
