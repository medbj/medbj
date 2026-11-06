import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { validateContent } from './check-content.mjs';
import { validateLaunch } from './check-launch.mjs';

const metadata = (overrides = {}) => ({
  title: 'A reviewed article',
  description: 'Plain-language information about rest.',
  date: '2026-01-05',
  updated: '2026-01-07',
  slug: 'a-reviewed-article',
  category: 'sleep',
  tags: ['rest'],
  author: 'Editorial team',
  reviewedOn: '2026-01-07',
  keyTakeaways: ['Allow time for rest.'],
  references: [
    {
      title: 'NHS sleep information',
      url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/',
    },
  ],
  sensitive: false,
  draft: false,
  sample: false,
  lang: 'en',
  ...overrides,
});
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'psychology-content-check-'));
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  mkdirSync(join(root, 'src/content/media'), { recursive: true });
  mkdirSync(join(root, 'src/data'), { recursive: true });
  const post = (
    filename,
    data = metadata(),
    body = 'General educational information.',
  ) =>
    writeFileSync(
      join(root, 'src/content/posts', filename),
      `---\n${JSON.stringify(data)}\n---\n${body}\n`,
    );
  try {
    run({ root, post });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('validator accepts complete raw metadata without changing its slug or dates', () =>
  fixture(({ root, post }) => {
    post('different-source-filename.md');
    const result = validateContent(root);
    assert.deepEqual(result.errors, []);
    assert.equal(result.posts[0].data.slug, 'a-reviewed-article');
    assert.equal(result.posts[0].data.date, '2026-01-05');
  }));

test('duplicate explicit slugs fail even across nested files and drafts', () =>
  fixture(({ root, post }) => {
    post('first.md');
    mkdirSync(join(root, 'src/content/posts/nested'));
    post('nested/second.md', metadata({ draft: true }));
    assert.ok(
      validateContent(root).errors.some((error) =>
        /duplicate slug "a-reviewed-article".*first\.md/.test(error),
      ),
    );
  }));

test('calendar-invalid dates are rejected instead of silently normalized', () =>
  fixture(({ root, post }) => {
    post(
      'bad-date.md',
      metadata({ date: '2026-02-30', updated: '2026-13-01' }),
    );
    const errors = validateContent(root).errors;
    assert.ok(errors.some((error) => /date must be a real ISO/.test(error)));
    assert.ok(errors.some((error) => /updated must be a real ISO/.test(error)));
  }));

test('empty cover and inline image alternatives are rejected', () =>
  fixture(({ root, post }) => {
    post(
      'missing-alt.md',
      metadata({
        cover: { src: '/rest.webp', alt: '', width: 1200, height: 800 },
      }),
      '![](/rest.webp)\n<img src="/rest.webp" width="1200" height="800">',
    );
    const errors = validateContent(root).errors;
    assert.ok(errors.some((error) => /cover\.alt/.test(error)));
    assert.ok(errors.some((error) => /inline Markdown images/.test(error)));
    assert.ok(errors.some((error) => /inline img elements/.test(error)));
  }));

test('launch rejects samples in drafts and disabled media even when confirmations are supplied', () =>
  fixture(({ root, post }) => {
    for (let index = 1; index <= 8; index++)
      post(`reviewed-${index}.md`, metadata({ slug: `reviewed-${index}` }));
    post(
      'sample-draft.md',
      metadata({
        slug: 'sample-draft',
        sample: true,
        draft: true,
        reviewedOn: null,
      }),
    );
    writeFileSync(
      join(root, 'src/content/media/sample.json'),
      JSON.stringify({
        title: 'Disabled sample',
        date: '2026-01-05',
        sample: true,
      }),
    );
    writeFileSync(
      join(root, 'src/data/crisis-resources.json'),
      JSON.stringify([
        {
          country: 'United States',
          service: '988',
          number: '988',
          hours: 'Verified in fixture only',
          languages: ['English'],
          verified: true,
          lastVerified: '2026-01-05',
        },
      ]),
    );
    const result = validateLaunch(root, {
      checkBuiltSite: false,
      env: {
        SITE_URL: 'https://reading-room.org',
        PUBLIC_NEWSLETTER_ACTION_URL:
          'https://newsletter-provider.org/subscribe',
        PUBLIC_NEWSLETTER_DOUBLE_OPT_IN_CONFIRMED: 'true',
        LEGAL_REVIEW_CONFIRMED: 'true',
        EDITORIAL_PROCESS_CONFIRMED: 'true',
      },
    });
    assert.equal(result.realReviewedArticles, 8);
    assert.ok(
      result.errors.some((error) =>
        /sample-draft\.md: sample content/.test(error),
      ),
    );
    assert.ok(
      result.errors.some((error) => /sample\.json: sample content/.test(error)),
    );
  }));

test('launch diagnoses missing environment and unverified crisis data without exposing values', () =>
  fixture(({ root, post }) => {
    post('one.md');
    writeFileSync(
      join(root, 'src/data/crisis-resources.json'),
      JSON.stringify([
        {
          country: 'France',
          service: '3114',
          number: '3114',
          hours: 'Not yet verified',
          languages: [],
          verified: false,
          lastVerified: null,
        },
      ]),
    );
    const result = validateLaunch(root, {
      checkBuiltSite: false,
      env: { SITE_URL: 'http://localhost:4321/?private=secret-fixture-value' },
    });
    assert.ok(result.errors.some((error) => /SITE_URL/.test(error)));
    assert.ok(result.errors.some((error) => /a human must verify/.test(error)));
    assert.ok(result.errors.some((error) => /lastVerified/.test(error)));
    assert.ok(result.errors.some((error) => /At least 8/.test(error)));
    assert.ok(!result.errors.join('\n').includes('secret-fixture-value'));
  }));

test('a new Markdown file needs only four fields and gets stable publication defaults', () =>
  fixture(({ root, post }) => {
    post('a-simple-start.md', {
      title: 'A simple start',
      description: 'A short introduction.',
      date: '2026-01-05',
      category: 'Everyday life',
    });
    const { errors, posts } = validateContent(root);
    assert.deepEqual(errors, []);
    assert.equal(posts[0].data.slug, 'a-simple-start');
    assert.equal(posts[0].data.topic, 'everyday-life');
    assert.equal(posts[0].data.updated, '2026-01-05');
    assert.equal(posts[0].data.draft, false);
    assert.equal(posts[0].data.lang, 'en');
    assert.equal(posts[0].data.reviewedOn, null);
    assert.deepEqual(posts[0].data.tags, []);
  }));

test('Arabic direction follows language and preserved MDX originals are inactive', () =>
  fixture(({ root, post }) => {
    post('reading.md', metadata({ lang: 'ar', dir: 'ltr' }));
    post('reading.mdx');
    const { errors, posts } = validateContent(root);
    assert.deepEqual(errors, []);
    assert.equal(posts.length, 1);
    assert.equal(posts[0].data.dir, 'rtl');
  }));

test('descriptions over 160 characters and string draft flags fail authoring validation', () =>
  fixture(({ root, post }) => {
    post(
      'invalid.md',
      metadata({ description: 'x'.repeat(161), draft: 'false' }),
    );
    const { errors } = validateContent(root);
    assert.ok(errors.some((error) => /160 characters/.test(error)));
    assert.ok(errors.some((error) => /draft must be a boolean/.test(error)));
  }));

test('post numbers cannot collide with the paginated blog route', () =>
  fixture(({ root, post }) => {
    post('2.md', {
      title: 'A simple start',
      description: 'A short introduction.',
      date: '2026-01-05',
      category: 'Rest',
    });
    assert.ok(
      validateContent(root).errors.some((error) =>
        /reserved for blog pagination/.test(error),
      ),
    );
  }));
