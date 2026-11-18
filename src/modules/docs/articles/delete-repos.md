---
title: Delete selected GitHub repositories
summary: List your GitHub repositories, mark the ones to delete, and delete only those, with a backup of each repository first.
category: DevOps and tools
order: 50
---

# Delete selected GitHub repositories

This guide makes a list of your repositories in a text file. You mark the repositories to delete with `x`, then a script deletes only the marked repositories. Before it deletes a repository, the script makes a backup copy in `Downloads/repo-backups`. If the backup fails, the script does not delete that repository.

> **WARNING:** A deleted repository is removed from GitHub. The backup has only the code, branches, and tags. Issues, pull requests, releases, and wiki pages are not in the backup.

## Before you start

- A Mac with Terminal, `git`, and `curl`.
- A GitHub account that owns the repositories. The list shows only repositories that your account owns.

## Get a GitHub token

1. Open <https://github.com/settings/tokens/new?scopes=repo,delete_repo&description=repo-delete>.
2. If GitHub asks, sign in.
3. Set **Expiration** to **7 days**.
4. Make sure that the **repo** box and the **delete_repo** box have a tick.
5. Scroll down and click **Generate token**.
6. Copy the token. It starts with `ghp_`.

## Make the list

1. Open Terminal: push **Cmd + Space**, type `Terminal`, then push **Return**.
2. Copy the script below into a text editor.
3. Replace `PASTE_YOUR_TOKEN_HERE` with your token. Keep the quotes.
4. Copy the full script, paste it into Terminal, then push **Return**.

```bash
{
TOKEN="PASTE_YOUR_TOKEN_HERE"
LIST="$HOME/Downloads/github-repos.txt"
echo "# Put x between the brackets of each repo to delete, then save this file." > "$LIST"
page=1
while :; do
  rows=$(curl -fsS -H "Authorization: Bearer $TOKEN" "https://api.github.com/user/repos?affiliation=owner&per_page=100&page=$page" | grep -oE '"full_name": *"[^"]*"|"private": *(true|false)' | sed -E 's/.*"([^"]*)"$/\1/; s/.*true$/private/; s/.*false$/public/' | paste - -)
  [ -z "$rows" ] && break
  printf '%s\n' "$rows" | awk '{printf "[ ] %-50s %s\n", $1, $2}' >> "$LIST"
  page=$((page + 1))
done
echo "Repos found: $(grep -c '^\[ \]' "$LIST")"
open -e "$LIST"
}
```

**Result:** Terminal shows the number of repositories, and the list opens in TextEdit. The file is `Downloads/github-repos.txt`.

## Mark the repositories to delete

1. In TextEdit, put `x` between the brackets of each repository to delete.
2. Do not change the other lines.
3. Push **Cmd + S** to save the file.

Example:

```text
[x] your-name/old-test-project                         public
[ ] your-name/website                                  public
[x] your-name/temp-notes                               private
```

This example deletes `old-test-project` and `temp-notes`. It keeps `website`.

## Delete the marked repositories

1. Copy the script below into a text editor.
2. Replace `PASTE_YOUR_TOKEN_HERE` with your token. Use the same token as before.
3. Copy the full script, paste it into Terminal, then push **Return**.
4. The script shows the marked repositories. Read the list carefully.
5. To continue, type `DELETE` and push **Return**. To cancel, type anything else.

```bash
{
TOKEN="PASTE_YOUR_TOKEN_HERE"
LIST="$HOME/Downloads/github-repos.txt"
BACKUP="$HOME/Downloads/repo-backups"
AUTH=$(printf 'x-access-token:%s' "$TOKEN" | base64)
export GIT_TERMINAL_PROMPT=0
marked=$(sed -nE 's/^\[ *[xX] *\] *([^ ]+).*/\1/p' "$LIST")
if [ -z "$marked" ]; then
  echo "No repos marked with x. Nothing deleted."
else
  echo "Marked repos:"
  printf '%s\n' "$marked" | sed 's/^/  /'
  count=$(printf '%s\n' "$marked" | grep -c .)
  printf 'Type DELETE to delete these %s repos: ' "$count"
  read -r answer < /dev/tty
  if [ "$answer" = "DELETE" ]; then
    mkdir -p "$BACKUP"
    printf '%s\n' "$marked" | while read -r repo; do
      dir="$BACKUP/$(printf '%s' "$repo" | tr / _).git"
      if [ -d "$dir" ]; then
        git -c http.extraHeader="Authorization: Basic $AUTH" --git-dir="$dir" fetch -q --prune origin
      else
        git -c http.extraHeader="Authorization: Basic $AUTH" clone --mirror -q "https://github.com/$repo.git" "$dir"
      fi
      if [ $? -ne 0 ]; then
        echo "SKIPPED, backup failed: $repo"
      elif curl -fsS -o /dev/null -X DELETE -H "Authorization: Bearer $TOKEN" "https://api.github.com/repos/$repo"; then
        echo "Deleted: $repo"
      else
        echo "FAILED: $repo"
      fi
    done
  else
    echo "Cancelled. Nothing deleted."
  fi
fi
}
```

**Result:** Terminal shows `Deleted: <repo>` for each deleted repository. Each backup is in `Downloads/repo-backups` as `<owner>_<repo>.git`.

## Remove the token

1. Close Terminal. This removes the token from the open session.
2. Open <https://github.com/settings/tokens> and click **Delete** next to `repo-delete`.
3. Keep the `Downloads/repo-backups` folder until you are sure that you do not need the repositories.

## Restore a backup

1. Create a new, empty repository on GitHub. Do not add a README, a licence, or a `.gitignore`.
2. Run this command in Terminal. Replace `your-name_repo-name` with the backup folder name, and `your-name/new-repo-name` with the new repository:

   ```bash
   git --git-dir="$HOME/Downloads/repo-backups/your-name_repo-name.git" push --mirror https://github.com/your-name/new-repo-name.git
   ```

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `Repos found: 0` | The token is wrong or has expired. | Make a new token and make the list again. |
| `curl: (22) ... 401` | The token is wrong. | Make sure that you copied the full token. |
| `FAILED: ...` with `403` | The token does not have the **delete_repo** scope. | Make a new token with both boxes ticked. |
| `SKIPPED, backup failed` | The backup did not complete. The script did not delete this repository. | Check your internet connection and delete the marked repositories again. |
| You deleted the wrong repository | | Open <https://github.com/settings/deleted_repositories>. You can restore most deleted repositories for 90 days. |

## Related links

- [Download all your GitHub gists as Markdown files](doc:download-gists)
- [GitHub REST API: repositories](https://docs.github.com/en/rest/repos/repos)
