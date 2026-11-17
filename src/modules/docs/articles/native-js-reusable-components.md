---
title: Native JS reusable components cheat sheet
summary: Patterns for reusable plain JavaScript components that load API data and render Bootstrap 5.3 cards, modals, and web components.
category: TypeScript and JavaScript
order: 20
gist: 1203e6f179cec9f324fbe786e84fa19e
---

# Native JS reusable components cheat sheet

This cheat sheet shows how to make reusable UI components with plain JavaScript modules, the Fetch API, and Bootstrap 5.3. Use it when you want components without a framework.

## Before you start

- A browser that supports ES modules.
- Bootstrap 5.3.8 and jQuery 3.7.1 (slim). The `index.html` file loads them from a CDN.
- A local web server. Browsers do not load ES modules from `file://` URLs.

## Folder structure

This is a suggested structure:

```text
/components
  └── CardComponent.js
  └── ModalComponent.js
/api
  └── fetchData.js
index.html
main.js
styles.css
```

## Component structure

```js
// CardComponent.js
export class CardComponent {
  constructor(data) {
    this.data = data;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'card mb-3';

    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${this.data.title}</h5>
        <p class="card-text">${this.data.body}</p>
        <a href="#" class="btn btn-primary">Action</a>
      </div>
    `;

    return card;
  }
}
```

> **TIP:** Return a DOM element from `render()`. Then you can add the result to the page with `appendChild`.

## Fetch API data

```js
// fetchData.js
export async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('API request failed');
  return await response.json();
}
```

## Use components dynamically

The `init` function loads 5 posts from JSONPlaceholder and renders one card for each post. If the request fails, it shows a Bootstrap alert.

```js
// main.js
import { fetchData } from './api/fetchData.js';
import { CardComponent } from './components/CardComponent.js';
import { ModalComponent } from './components/ModalComponent.js';

async function init() {
  const container = document.getElementById('app');

  try {
    const data = await fetchData('https://jsonplaceholder.typicode.com/posts?_limit=5');
    
    data.forEach(item => {
      const card = new CardComponent(item);
      container.appendChild(card.render());
    });

    // new ModalComponent({
    //   title: 'Hello!',
    //   body: 'This is a Bootstrap modal rendered via JS component.'
    // }).render();
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load data</div>`;
    console.error(err);
  }
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
```

## The index.html boilerplate

This page loads Bootstrap 5.3 and loads `main.js` as a module.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reusable JS Components</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
  <script src="https://code.jquery.com/jquery-3.7.1.slim.min.js" integrity="sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8=" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
</head>
<body>
  <div class="container mt-5" id="app"></div>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## Modal component

This component adds a Bootstrap modal to the page and shows it. It uses `Date.now()` to make a unique modal ID.

```js
// ModalComponent.js
export class ModalComponent {
  constructor({ title, body }) {
    this.title = title;
    this.body = body;
  }

  render() {
    const modalId = `modal-${Date.now()}`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${this.title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              ${this.body}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    const modal = new bootstrap.Modal(wrapper.querySelector(`#${modalId}`));
    modal.show();
  }
}
```

Usage:

```js
import { ModalComponent } from './components/ModalComponent.js';

new ModalComponent({
  title: 'Hello!',
  body: 'This is a Bootstrap modal rendered via JS component.'
}).render();
```

## Helper utilities

These helpers are optional.

```js
// utils.js
export function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  el.className = className;
  el.innerHTML = innerHTML;
  return el;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

## Tips for reusability

- Send data to the component through the constructor or through `render` parameters.
- Do not hardcode DOM selectors.
- Use event delegation when you add listeners.
- Keep components self-contained.
- To go further, use `customElements` to make Web Components.

## Web component base

This optional base class makes the same card as a custom element.

```js
class MyCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${this.getAttribute('title')}</h5>
          <p class="card-text">${this.getAttribute('body')}</p>
        </div>
      </div>
    `;
  }
}
customElements.define('my-card', MyCard);
```

Usage:

```html
<my-card title="Hello" body="This is a web component card."></my-card>
```

## Related links

- [Bootstrap 5.3 docs](https://getbootstrap.com/docs/5.3/)
- [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [HTML Playcode](https://playcode.io/html)
