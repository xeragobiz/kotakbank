/*
 * Apply Form — credit-card application form rendered on the /apply page.
 * Fields: Full Name, Mobile Number, Email, Date of Birth, PAN, Aadhaar (opt).
 * Client-side validation, then POST as JSON to a submit endpoint.
 *
 * The clicked card's name arrives as a ?card= query param and is shown
 * read-only so the applicant/agent knows which card the application is for.
 *
 * Authorable chrome (optional, in this order): heading, sub-heading,
 * submit-button text, success message. A block cell may also override the
 * endpoint by starting with "endpoint:" (e.g. endpoint: https://…/bff/contact).
 *
 * Submits to a cloud BFF (Adobe App Builder) action, which injects the
 * web3forms access_key server-side and forwards the fields. The browser never
 * sees the secret. The action responds with web3forms' JSON: { success, message }.
 */

// Authored per-page via an "endpoint:" cell (the BFF contact action URL).
// Fallback keeps the form testable if no endpoint is authored.
const DEFAULT_ENDPOINT = 'https://httpbin.org/post';

const FIELDS = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    required: true,
    autocomplete: 'name',
    validate: (v) => (/^[A-Za-z][A-Za-z\s.'-]*$/.test(v.trim())
      ? '' : 'Please enter letters only.'),
  },
  {
    name: 'mobile',
    label: 'Mobile Number',
    type: 'tel',
    required: true,
    inputmode: 'numeric',
    maxlength: 10,
    autocomplete: 'tel',
    validate: (v) => (/^\d{10}$/.test(v.trim())
      ? '' : 'Enter a valid 10-digit mobile number.'),
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    autocomplete: 'email',
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? '' : 'Enter a valid email address.'),
  },
  {
    name: 'dob',
    label: 'Date of Birth',
    type: 'date',
    required: true,
    validate: (v) => {
      if (!v) return 'Please select your date of birth.';
      const dob = new Date(v);
      if (Number.isNaN(dob.getTime())) return 'Please select a valid date.';
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
      return age >= 18 ? '' : 'You must be at least 18 years old.';
    },
  },
  {
    name: 'pan',
    label: 'PAN Number',
    type: 'text',
    required: true,
    maxlength: 10,
    uppercase: true,
    autocomplete: 'off',
    validate: (v) => (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.trim().toUpperCase())
      ? '' : 'Enter a valid PAN (e.g. ABCDE1234F).'),
  },
  {
    name: 'aadhaar',
    label: 'Aadhaar Number ',
    type: 'text',
    required: false,
    inputmode: 'numeric',
    maxlength: 12,
    autocomplete: 'off',
    validate: (v) => (!v.trim() || /^\d{12}$/.test(v.trim())
      ? '' : 'Aadhaar must be 12 digits.'),
  },
];

/* pull authored chrome text from block cells, in order, ignoring empties.
   The submit endpoint is identified by content (a URL, or an "endpoint:"
   prefix) rather than position, so it works as its own authored field and
   is robust to any earlier field being left empty. */
function readChrome(block) {
  const cells = [...block.children]
    .map((r) => (r.querySelector(':scope > div') || r).textContent.trim())
    .filter(Boolean);
  let endpoint = DEFAULT_ENDPOINT;
  const rest = [];
  cells.forEach((t) => {
    if (/^endpoint\s*:/i.test(t)) endpoint = t.replace(/^endpoint\s*:/i, '').trim();
    else if (/^https?:\/\//i.test(t)) endpoint = t;
    else rest.push(t);
  });
  const [heading, subtitle, submitText, successMsg] = rest;
  return {
    heading: heading || 'Apply for your Credit Card',
    subtitle: subtitle || 'Fill in your details and our team will reach out to you.',
    submitText: submitText || 'Submit Application',
    successMsg: successMsg || 'Thank you! Your application has been received. Our team will be in touch shortly.',
    endpoint,
  };
}

/* build one labelled field with an inline error slot */
function buildField(field) {
  const wrap = document.createElement('div');
  wrap.className = 'apply-form-field';

  const id = `apply-${field.name}`;
  const label = document.createElement('label');
  label.className = 'apply-form-label';
  label.setAttribute('for', id);
  label.textContent = field.label;
  if (field.required) {
    const req = document.createElement('span');
    req.className = 'apply-form-required';
    req.setAttribute('aria-hidden', 'true');
    req.textContent = ' *';
    label.append(req);
  }

  const input = document.createElement('input');
  input.id = id;
  input.name = field.name;
  input.type = field.type;
  input.className = 'apply-form-input';
  if (field.required) input.required = true;
  if (field.inputmode) input.inputMode = field.inputmode;
  if (field.maxlength) input.maxLength = field.maxlength;
  if (field.autocomplete) input.autocomplete = field.autocomplete;
  input.setAttribute('aria-describedby', `${id}-error`);

  // keep digit-only fields clean as the user types
  if (field.inputmode === 'numeric') {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, field.maxlength || 20);
    });
  }
  if (field.uppercase) {
    input.addEventListener('input', () => {
      const pos = input.selectionStart;
      input.value = input.value.toUpperCase();
      input.setSelectionRange(pos, pos);
    });
  }

  const error = document.createElement('span');
  error.className = 'apply-form-error';
  error.id = `${id}-error`;
  error.setAttribute('aria-live', 'polite');

  wrap.append(label, input, error);
  return { wrap, input, error };
}

export default function decorate(block) {
  const chrome = readChrome(block);
  const params = new URLSearchParams(window.location.search);
  const cardName = (params.get('card') || '').trim();

  const root = document.createElement('div');
  root.className = 'apply-form-inner';

  const head = document.createElement('div');
  head.className = 'apply-form-head';
  const h = document.createElement('h1');
  h.className = 'apply-form-title';
  h.textContent = chrome.heading;
  const sub = document.createElement('p');
  sub.className = 'apply-form-subtitle';
  sub.textContent = chrome.subtitle;
  head.append(h, sub);
  if (cardName) {
    const chosen = document.createElement('p');
    chosen.className = 'apply-form-chosen';
    chosen.innerHTML = `Applying for: <strong>${cardName.replace(/[<>&]/g, '')}</strong>`;
    head.append(chosen);
  }
  root.append(head);

  const form = document.createElement('form');
  form.className = 'apply-form-form';
  form.noValidate = true;

  const controls = FIELDS.map((field) => {
    const built = buildField(field);
    form.append(built.wrap);
    // clear the error as soon as the user edits a previously-invalid field
    built.input.addEventListener('input', () => {
      built.error.textContent = '';
      built.input.classList.remove('apply-form-input-invalid');
    });
    return { field, ...built };
  });

  const status = document.createElement('p');
  status.className = 'apply-form-status';
  status.setAttribute('aria-live', 'polite');

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'apply-form-submit';
  submit.textContent = chrome.submitText;

  form.append(status, submit);

  const runValidation = () => {
    let firstInvalid = null;
    controls.forEach((c) => {
      const msg = c.field.validate(c.input.value);
      c.error.textContent = msg;
      c.input.classList.toggle('apply-form-input-invalid', !!msg);
      if (msg && !firstInvalid) firstInvalid = c.input;
    });
    return firstInvalid;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'apply-form-status';

    const firstInvalid = runValidation();
    if (firstInvalid) {
      firstInvalid.focus();
      status.textContent = 'Please fix the highlighted fields.';
      status.classList.add('apply-form-status-error');
      return;
    }

    const payload = { card: cardName || undefined };
    controls.forEach((c) => {
      const v = c.input.value.trim();
      payload[c.field.name] = c.field.uppercase ? v.toUpperCase() : v;
    });

    submit.disabled = true;
    submit.textContent = 'Submitting…';
    try {
      const resp = await fetch(chrome.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      // the BFF forwards web3forms' JSON: { success: boolean, message: string }
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || result.success === false) {
        throw new Error(result.message || `Request failed (${resp.status})`);
      }
      form.reset();
      root.replaceChildren(head, (() => {
        const done = document.createElement('div');
        done.className = 'apply-form-success';
        done.textContent = chrome.successMsg;
        return done;
      })());
    } catch (err) {
      status.textContent = 'Something went wrong submitting your application. Please try again.';
      status.classList.add('apply-form-status-error');
      submit.disabled = false;
      submit.textContent = chrome.submitText;
    }
  });

  root.append(form);
  block.replaceChildren(root);
}
