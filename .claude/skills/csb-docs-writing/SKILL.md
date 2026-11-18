---
name: csb-docs-writing
description: Writing rules, article structure, front matter, and the Markdown subset for the Docs module (src/modules/docs/articles/*.md). Use when adding, rewriting, or editing any Docs article, or when changing the Docs Markdown renderer.
---

# Docs Articles

Each article is one Markdown file in `src/modules/docs/articles/<slug>.md`. The file name is the slug. The Docs module renders the Markdown with its own parser. It does not render raw HTML.

## Front Matter

Every file starts with this block. Use plain text values on one line. Do not use quotes.

```
---
title: Angular Tour of Heroes, part 1: The hero editor
summary: One sentence, 25 words maximum, that tells what the reader gets from the article.
category: Angular
order: 20
---
```

| Key | Rule |
| --- | --- |
| `title` | Sentence case. Same text as the `#` heading. |
| `summary` | One sentence. It shows in the article list and in search. |
| `category` | One value from the category list below. Spell it exactly. |
| `order` | Integer. It sorts articles in a category. Use steps of 10. |

Categories, in sidebar order: `C# and .NET`, `ASP.NET and Blazor`, `.NET MAUI`, `Angular`, `React`, `TypeScript and JavaScript`, `Flutter and Android`, `Identity and APIs`, `Dynamics 365`, `DevOps and tools`, `Systems and setup`, `AI and design`, `Reference`.

## Language (ASD-STE100)

1. Use active voice. Write "The service sends the email." Do not write "The email is sent by the service."
2. Put one idea in one sentence. Use 20 words maximum in a procedure sentence and 25 words maximum in a description sentence.
3. Write instructions as commands. Write "Run the command." Do not write "You may want to run the command."
4. Use present tense for facts.
5. Give one meaning to one word. Keep the term you pick in the whole article.
6. Use the simple word: "use", not "utilize"; "start", not "initiate"; "help", not "facilitate"; "show", not "demonstrate".
7. Use three words maximum in a noun group, where you can. Product and API names are exceptions.
8. State the condition first. Write "If the build fails, clear the cache."
9. Keep articles ("a", "the") and normal grammar.
10. Do not use em dashes or en dashes as punctuation. Use a comma, a colon, parentheses, or a new sentence. A hyphen in a range ("1-5") or a compound word is correct.
11. Do not use emoji, marketing words ("ultimate", "powerful", "seamless"), or filler ("simply", "just", "basically", "it is important to note that").
12. Write numbers as digits. Write units with a space: "5 MB", "30 s".

## Structure

Every article uses this order. Leave out a section that has no content. Do not add an empty section.

1. `# Title` (only one `#` heading in the file).
2. An introduction of 1 to 3 sentences: what the article is about and when to use it. No heading.
3. `## Before you start`: requirements, versions, accounts, packages. Use a list or a table.
4. Body sections with `##` headings. Use `###` for subsections. Use `####` only when necessary; it does not show in the page navigation.
5. `## Troubleshooting`: problems and fixes, as `### <symptom>` subsections or a table with `Problem`, `Cause`, and `Fix` columns.
6. `## Related links`: external links and links to other articles, as a list.

Patterns by article type:

| Type | Body sections |
| --- | --- |
| Procedure or tutorial | One `##` section per task, with an imperative title ("Create the service"). Numbered steps inside. Add `**Result:**` after a step when the reader must check something. |
| Cheat sheet or reference | One `##` section per topic. Tables for commands, options, and links. Short code blocks. |
| Code sample | `## Code` (full code), `## How to use it` (a call example), `## How it works` (only facts the code does not make clear). |
| Link collection | One `##` section per group. A table with `Name`, `Link`, and `Notes` columns. |

Headings: sentence case. No numbers in headings ("1.", "Step 2:") except in a tutorial series title. No bold, links, or code in headings, except a code identifier that is the subject.

## Content Rules

1. Keep every unique fact, command, code sample, link, version number, setting, and warning. Content is in the source for a reason.
2. Remove redundancy: duplicate code, the same explanation in two places, repeated warnings, and filler. If two versions of code differ, keep both and say how they differ.
3. Do not change what code does. You can fix typos in code comments, remove em dashes from comments, and fix indentation. Do not invent code, versions, or facts.
4. Remove manual tables of contents. The page shows its own navigation.
5. Convert raw HTML to Markdown: `<details>` becomes a section, `<a href>` becomes a Markdown link, `<br>` becomes a new line or a list, HTML tables become Markdown tables. Keep HTML that is part of a code sample inside a code block.
6. A source that holds a full HTML page or source file without text becomes a code sample article. Write the introduction, `## How to use it`, and `## How it works` from the code.
7. Split one source into more than one article only when it holds unrelated topics. Each part gets its own slug (`<main-slug>-<topic>`) and its own `order`.

## Markdown Subset

The renderer supports only these elements:

| Element | Syntax |
| --- | --- |
| Headings | `#` to `####`, ATX style only |
| Emphasis | `**bold**`, `*italic*`, `~~strike~~`, `` `code` `` |
| Links | `[text](https://example.com)`, `[text](#heading-id)` for this article, `[text](doc:slug)` or `[text](doc:slug#heading-id)` for another article |
| Images | `![alt text](https://example.com/image.png)` |
| Lists | `-` or `1.` with 2 or 3 spaces of indent for each nested level. Task items: `- [ ]` and `- [x]` |
| Code blocks | Fenced with three backticks and a language: `csharp`, `xml`, `json`, `ts`, `js`, `html`, `css`, `bash`, `powershell`, `cmd`, `sql`, `dart`, `yaml`, `xpp`, `kotlin`, `swift`, `java`, `python`, `php`, `dockerfile`, `ini`, `http`, `text` |
| Tables | GitHub pipe tables with a header row. Escape a pipe in a cell as `\|` |
| Notes | A blockquote that starts with `**NOTE:**`, `**TIP:**`, `**IMPORTANT:**`, `**WARNING:**`, or `**CAUTION:**` |
| Rule | `---` on its own line (use rarely) |

A heading ID is the heading text in lowercase, with characters other than letters, digits, spaces, and hyphens removed, and spaces changed to hyphens. Example: `## Create the C# service` has the ID `create-the-c-service`.

## Check

1. Run `grep -rn '[—–]' src/modules/docs/articles` and expect no output.
2. Run `npm test`. The docs test checks the front matter, the categories, unique slugs, one `#` heading, and `doc:` links.
