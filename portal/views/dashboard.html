<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Client Key Dashboard</title>
  <style>
    body {
      font-family: monospace;
      background: #111;
      color: #eee;
      padding: 2rem;
    }
    #login-status {
      font-weight: bold;
      margin-bottom: 1rem;
    }
    #generate {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      margin-bottom: 1rem;
      cursor: pointer;
    }
    #generate:disabled {
      background: #444;
      cursor: not-allowed;
    }
    a {
      color: #0f0;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    #key {
      margin-top: 1rem;
    }
  </style>
</head>
<body>

<h1>Client Key Dashboard</h1>

<div id="login-status">Checking login status...</div>

<button id="generate" disabled>Generate Client Key</button>
<p id="key"></p>

<script>
const loginStatus = document.getElementById("login-status");
const generateBtn = document.getElementById("generate");
const keyParagraph = document.getElementById("key");

// --- Check if user is logged in ---
async function checkLogin() {
  try {
    const res = await fetch("/auth/me");
    const data = await res.json();

    if (data.loggedIn) {
      loginStatus.textContent = `Logged in as: ${data.username}`;
      generateBtn.disabled = false;
      loadKeyStatus();
    } else {
      loginStatus.textContent = "Not logged in";
      generateBtn.disabled = true;
      keyParagraph.textContent = "";
    }
  } catch {
    loginStatus.textContent = "Error checking login";
    generateBtn.disabled = true;
  }
}

// --- Load existing key (if any) ---
async function loadKeyStatus() {
  try {
    const res = await fetch("/keys/status");
    const data = await res.json();

    if (data.file) {
      keyParagraph.innerHTML = `
        ✅ Key already generated: <a href="/keys-downloads/${data.file}" download>Download Key</a><br>
        ${data.warning}
      `;
      generateBtn.disabled = true;
    }
  } catch {
    keyParagraph.textContent = "";
  }
}

// --- Generate new key ---
generateBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/keys/generate", { method: "POST" });
    const data = await res.json();

    if (!data.ok && data.msg) {
      keyParagraph.textContent = data.msg;
      return;
    }

    keyParagraph.innerHTML = `
      ✅ Key file ready: <a href="/keys-downloads/${data.file}" download>Download Key</a><br>
      ${data.warning}
    `;
    generateBtn.disabled = true;
  } catch {
    keyParagraph.textContent = "Error generating key!";
  }
});

// --- Run on page load ---
checkLogin();
</script>

</body>
</html>
