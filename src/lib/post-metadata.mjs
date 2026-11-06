/** @param {string} value */
export function taxonomySlug(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** @param {string} file */
export function filenameSlug(file) {
  return taxonomySlug(file.split(/[\\/]/).at(-1).replace(/\.md$/i, ''));
}

/** Defaults shared by the raw-file validator and the Astro loader. */
export function normalizePostData(data, file) {
  const lang = data.lang === undefined ? 'en' : data.lang;
  return {
    tags: [],
    reviewedOn: null,
    references: [],
    keyTakeaways: [],
    draft: false,
    sensitive: false,
    sample: false,
    ...data,
    slug: data.slug === undefined ? filenameSlug(file) : data.slug,
    updated: data.updated === undefined ? data.date : data.updated,
    topic: typeof data.category === 'string' ? taxonomySlug(data.category) : '',
    lang,
    dir:
      typeof lang === 'string' && /^(ar|fa|he|ur)(-|$)/i.test(lang)
        ? 'rtl'
        : data.dir || 'ltr',
  };
}
