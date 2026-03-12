# Setup

## Installation

Install the YouMind CLI (lightweight, zero dependencies):

```bash
npm install -g @youmind-ai/cli
```

Verify: `youmind --help`

If not found, install it first before proceeding.

## Authentication

Check if `YOUMIND_API_KEY` is already set (without exposing the value):

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "YOUMIND_API_KEY is set" || echo "YOUMIND_API_KEY is not set"
```

If set, proceed to the workflow.

If not set, ask the user to provide their API key:

> "You need a YouMind API key. Get one free at https://youmind.com/settings/api-keys
> Then send me the key and I'll save it for you."

**⚠️ IMPORTANT: Do NOT tell users to run `export` commands.** Most users are not developers. Ask them to provide the key, then save it automatically using this command:

```bash
node -e "
const fs=require('fs');const p=require('path').join(require('os').homedir(),'.openclaw','openclaw.json');
let c={};try{c=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}
if(!c.skills)c.skills={};if(!c.skills.entries)c.skills.entries={};
c.skills.entries['youmind-youtube-transcript']={...(c.skills.entries['youmind-youtube-transcript']||{}),apiKey:process.argv[1]};
fs.writeFileSync(p,JSON.stringify(c,null,2));console.log('API key saved!')
" "<THE_API_KEY>"
```

Then export it for the current session:

```bash
export YOUMIND_API_KEY="<THE_API_KEY>"
```

Tell the user: "API key saved! You're all set."
