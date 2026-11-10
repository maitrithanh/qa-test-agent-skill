/**
 * Return one page of items. Pages are 1-based. size must be a positive integer.
 * page < 1 throws RangeError. A page past the end returns [].
 */
export function paginate(items, page, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('size');
  return items.slice(page * size, (page + 1) * size);
}
