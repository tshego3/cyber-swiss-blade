var e=`---
title: Download all your GitHub gists as Markdown files
summary: Back up every public and private gist as a Markdown file on your Mac, then optionally delete the public gists from GitHub.
category: DevOps and tools
order: 40
---

# Download all your GitHub gists as Markdown files

This guide downloads all your gists and saves each gist file as a \`.md\` file. Public gists go to \`Downloads/gists/public\`. Private gists go to \`Downloads/gists/private\`.

## Before you start

- A Mac with Terminal, \`git\`, and \`curl\`.
- A GitHub account that owns the gists.

## Get a GitHub token

1. Open <https://github.com/settings/tokens/new?scopes=gist&description=gist-download>.
2. If GitHub asks, sign in.
3. Set **Expiration** to **7 days**.
4. Make sure that the **gist** box has a tick.
5. Scroll down and click **Generate token**.
6. Copy the token. It starts with \`ghp_\`.

## Download the gists

1. Open Terminal: push **Cmd + Space**, type \`Terminal\`, then push **Return**.
2. Copy the script below into a text editor.
3. Replace \`PASTE_YOUR_TOKEN_HERE\` with your token. Keep the quotes.
4. Copy the full script, paste it into Terminal, then push **Return**.

\`\`\`bash
TOKEN="PASTE_YOUR_TOKEN_HERE"
OUT="$HOME/Downloads/gists"
mkdir -p "$OUT/.git-data" "$OUT/public" "$OUT/private"
cd "$OUT"
page=1
while :; do
  list=$(curl -fsS -H "Authorization: Bearer $TOKEN" "https://api.github.com/gists?per_page=100&page=$page" | grep -oE '"git_pull_url": *"[^"]*"|"public": *(true|false)' | sed -E 's/.*"(https[^"]*)"/\\1/; s/.*true$/public/; s/.*false$/private/' | paste - -)
  [ -z "$list" ] && break
  printf '%s\\n' "$list" | while read -r url vis; do
    id=$(basename "$url" .git)
    if [ -d ".git-data/$id.git" ]; then
      git --git-dir=".git-data/$id.git" fetch -q origin '+refs/heads/*:refs/heads/*'
    else
      git clone --bare -q "$url" ".git-data/$id.git"
    fi
    git --git-dir=".git-data/$id.git" ls-tree --name-only HEAD | while read -r f; do
      base=\${f%.*}
      [ -z "$base" ] && base=$f
      rm -f "public/\${id}_\${base}.md" "private/\${id}_\${base}.md"
      git --git-dir=".git-data/$id.git" show "HEAD:$f" > "$vis/\${id}_\${base}.md"
    done
  done
  page=$((page + 1))
done
echo "Finished. Public: $(ls public | grep -c '\\.md$')  Private: $(ls private | grep -c '\\.md$')"
\`\`\`

**Result:** Terminal shows the number of public and private files.

## Find your files

1. Open **Finder > Downloads > gists**.
2. Open the **public** or **private** folder.

Each file name has the format \`<gist-id>_<file-name>.md\`. The script keeps a bare Git copy of each gist in \`gists/.git-data\`. If you run the script again, it updates the files that you already have.

> **NOTE:** If you used an older version of this script, delete the \`.md\` files directly in the \`gists\` folder. Copies of them are now in \`public\` and \`private\`.

## Delete all public gists on GitHub (optional)

> **WARNING:** This permanently deletes your public gists from GitHub. You cannot undo it. Private gists are not deleted.

Do [Download the gists](#download-the-gists) first. The script deletes a gist only if its backup is in \`Downloads/gists\`. If one backup is missing, the script stops and deletes nothing.

1. Copy the script below into a text editor.
2. Replace \`PASTE_YOUR_TOKEN_HERE\` with your token. Use the same token as before.
3. Copy the full script, paste it into Terminal, then push **Return**.
4. The script shows the number of public gists. To continue, type \`DELETE\` and push **Return**. To cancel, type anything else.

\`\`\`bash
{
TOKEN="PASTE_YOUR_TOKEN_HERE"
OUT="$HOME/Downloads/gists"
todo="$OUT/public-to-delete.txt"
: > "$todo"
page=1
while :; do
  list=$(curl -fsS -H "Authorization: Bearer $TOKEN" "https://api.github.com/gists?per_page=100&page=$page" | grep -oE '"git_pull_url": *"[^"]*"|"public": *(true|false)' | sed -E 's/.*"(https[^"]*)"/\\1/; s/.*true$/public/; s/.*false$/private/' | paste - -)
  [ -z "$list" ] && break
  printf '%s\\n' "$list" | awk '$2=="public"{sub(/.*\\//,"",$1); sub(/\\.git$/,"",$1); print $1}' >> "$todo"
  page=$((page + 1))
done
count=$(grep -c . "$todo")
missing=0
while read -r id; do
  [ -d "$OUT/.git-data/$id.git" ] || { echo "No backup: $id"; missing=1; }
done < "$todo"
if [ "$count" -eq 0 ]; then
  echo "No public gists found. Nothing deleted."
elif [ "$missing" -eq 1 ]; then
  echo "Stopped. Some backups are missing. Run the download script again. Nothing deleted."
else
  printf 'Public gists found: %s. Type DELETE to delete them: ' "$count"
  read -r answer < /dev/tty
  if [ "$answer" = "DELETE" ]; then
    while read -r id; do
      if curl -fsS -o /dev/null -X DELETE -H "Authorization: Bearer $TOKEN" "https://api.github.com/gists/$id"; then
        echo "Deleted: $id"
      else
        echo "FAILED: $id"
      fi
    done < "$todo"
  else
    echo "Cancelled. Nothing deleted."
  fi
fi
}
\`\`\`

The list of deleted gist IDs is in \`Downloads/gists/public-to-delete.txt\`. Your backups stay in \`Downloads/gists/public\`.

## Remove the token

1. Close Terminal. This removes the token from the open session.
2. Open <https://github.com/settings/tokens> and click **Delete** next to \`gist-download\`.

To download new gists later, make a new token and run the download script again.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| \`Public: 0  Private: 0\` | The token is wrong or has expired. | Make a new token and run the script again. |
| \`curl: (22) ... 401\` | The token is wrong. | Make sure that you copied the full token. |
| Git asks for a password | Git needs the token to clone. | Paste your token as the password. |

## Related links

- [GitHub REST API: gists](https://docs.github.com/en/rest/gists/gists)
- [Markdown cheat sheet](doc:markdown-cheat-sheet)
`;export{e as default};