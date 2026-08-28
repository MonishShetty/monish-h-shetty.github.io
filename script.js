const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.setProperty('--reveal-order', String(index % 8));
  observer.observe(element);
});

const loaderPhoto = document.querySelector('#loader-photo-image');
loaderPhoto?.addEventListener('load', () => {
  if (loaderPhoto.dataset.cleaned) return;
  loaderPhoto.dataset.cleaned = 'true';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  canvas.width = loaderPhoto.naturalWidth;
  canvas.height = loaderPhoto.naturalHeight;
  context.drawImage(loaderPhoto, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const isChecker = (index) => {
    const offset = index * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    return Math.max(red, green, blue) - Math.min(red, green, blue) < 10 && red > 220;
  };
  const add = (index) => {
    if (index < 0 || index >= total || visited[index] || !isChecker(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) { add(x); add((height - 1) * width + x); }
  for (let y = 0; y < height; y += 1) { add(y * width); add(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++];
    data[index * 4 + 3] = 0;
    const x = index % width;
    if (x > 0) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (index >= width) add(index - width);
    if (index < total - width) add(index + width);
  }
  context.putImageData(image, 0, 0);
  loaderPhoto.src = canvas.toDataURL('image/png');
});

const loader = document.querySelector('#page-loader');
const loaderBar = document.querySelector('#loader-bar');
const loaderPercent = document.querySelector('#loader-percent');
const loaderStart = performance.now();
const loaderDuration = 2800;

const animateLoader = (now) => {
  const progress = Math.min((now - loaderStart) / loaderDuration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const percentage = Math.round(eased * 100);
  loader?.style.setProperty('--load', `${percentage}%`);
  if (loaderBar) loaderBar.style.width = `${percentage}%`;
  if (loaderPercent) loaderPercent.textContent = String(percentage).padStart(2, '0');
  if (progress < 1) requestAnimationFrame(animateLoader);
  else {
    loader?.classList.add('is-complete');
    window.setTimeout(() => loader?.remove(), 700);
  }
};
requestAnimationFrame(animateLoader);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const contactForm = document.querySelector('#contact-form');
const formNote = document.querySelector('#form-note');
const recipient = String.fromCharCode(...[116,104,101,109,111,110,105,115,104,104,115,104,101,116,116,121,64,103,109,97,105,108,46,99,111,109]);

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = String(data.get('name') || '').trim();
  const message = String(data.get('message') || '').trim();
  const payload = {
    name,
    message,
    _subject: `Portfolio website inquiry from ${name}`,
    _captcha: 'false',
    _template: 'table'
  };
  const button = contactForm.querySelector('button[type="submit"]');
  formNote.textContent = 'Sending securely…';
  if (button) button.disabled = true;

  fetch('/api/contact', {
    method: 'POST',
    keepalive: true,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then((response) => response.json().then((result) => ({ ok: response.ok, result })))
    .then(({ ok, result }) => {
      if (!ok || result.success === false) throw new Error(result.message || 'Delivery unavailable');
      formNote.textContent = 'Inquiry delivered to the email relay. Please check your inbox or spam folder.';
      contactForm.reset();
    })
    .catch((error) => {
      formNote.textContent = error.message || 'The inquiry could not be delivered. Please try once more.';
    })
    .finally(() => { if (button) button.disabled = false; });
});
