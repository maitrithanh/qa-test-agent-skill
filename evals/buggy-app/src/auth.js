/**
 * Can `user` edit `doc`? Admins can edit anything; otherwise only the owner.
 * Ids are compared strictly ("1" is not 1). A missing user (null/undefined) can edit nothing.
 */
export function canEdit(user, doc) {
  return user.role === 'admin' || doc.ownerId == user.id;
}
