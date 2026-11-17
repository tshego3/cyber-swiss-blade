---
title: Markdown cheat sheet
summary: Markdown syntax for headings, emphasis, links, lists, code, task lists, tables, and other elements, with rendered examples where the Docs page supports them.
category: DevOps and tools
order: 30
gist: eb47a799965186b3b4fe201e19288afc
---

# Markdown cheat sheet

This cheat sheet shows the Markdown syntax for the most common elements. Each section shows the syntax in a code block. If this Docs page supports the element, the section also shows the rendered result.

## Headings

```text
# heading 1
## heading 2
### heading 3
#### heading 4
##### heading 5
```

Use 1 `#` for each heading level. This page renders levels 1 to 4 only.

## Emphasis

```text
*this text is italics*
_italic_
**bold**
~~strike~~
```

Result: *this text is italics*, **bold**, ~~strike~~.

The underscore form (`_italic_`) also gives italics.

## Horizontal line

```text
---
___
```

Result:

---

## Block quotes

```text
> this is a block
```

## Links

```text
[This is a link](inserlink.com)
[This is a link with tooltip](inserlink.com "tooltip")
```

Result: [This is a link](https://example.com)

The text in quotes after the URL is the tooltip.

## Lists

Unordered list (`*` or `-`), with a nested item:

```text
* item1
    * item2
```

Result:

- item1
  - item2

Ordered list:

```text
1. first item
2. second item
```

Result:

1. first item
2. second item

## Inline code

```text
`<p></p>`
```

Result: `<p></p>`

## Images

```text
![Hollow Knight](hollo.jpg)
```

The text in square brackets is the alt text. The text in parentheses is the image path or URL.

## Code blocks

Start a code block with a line of 3 backticks and the language name (for example, `bash`, `javascript`, or `python`). End it with a line of 3 backticks.

Bash code block:

```bash
    npm install
    
```

JavaScript code block (language name `javascript`):

```js
function add(num1, num2){

}

```

Python code block:

```python
print("Hi there")
```

## Task list

```text
* [x] done
* [ ] not done
```

Result:

- [x] done
- [ ] not done

## Tables

```text
| Column 1 | Column 2 | Column 3 |
| :---: | :--- | ---: |
| Row 1, Column 1 | Row 1, Column 2 | Row 1, Column 3 |
| Row 2, Column 1 | Row 2, Column 2 | Row 2, Column 3 |
| Row 3, Column 1 | Row 3, Column 2 | Row 3, Column 3 |
```

The second row sets the alignment of each column:

| Marker | Alignment |
| --- | --- |
| `:---:` | Center |
| `---:` | Right |
| `:---` | Left |

Result:

| Column 1 | Column 2 | Column 3 |
| :---: | :--- | ---: |
| Row 1, Column 1 | Row 1, Column 2 | Row 1, Column 3 |
| Row 2, Column 1 | Row 2, Column 2 | Row 2, Column 3 |
| Row 3, Column 1 | Row 3, Column 2 | Row 3, Column 3 |

## Diff

Use the language name `diff` on the code block. Start a removed line with `-` and an added line with `+`.

```text
- This line is removed.
+ This line is added.
```

## Collapsible content

Use the HTML `details` and `summary` elements. The content shows when the reader clicks the summary.

```html
<details>
<summary>Click to see more!</summary>

### More awesome tips!

- item 1
- item 2

</details>
```

## Comments

An HTML comment does not show in the rendered output. Use it for notes in the source:

```html
<!-- Italics -->
```

## Related links

- [Zairahira: Markdown Cheatsheet](https://github.com/zairahira/Markdown-cheatsheet/blob/main/README.md)
- [Adam Pritchard: Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
