const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

const uniqueSlug = async (prisma, model, text, id = null) => {
  let slug = slugify(text);
  let count = 0;
  while (true) {
    const candidate = count === 0 ? slug : `${slug}-${count}`;
    const where = id ? { slug: candidate, id: { not: id } } : { slug: candidate };
    const existing = await prisma[model].findFirst({ where });
    if (!existing) return candidate;
    count++;
  }
};

module.exports = { slugify, uniqueSlug };
