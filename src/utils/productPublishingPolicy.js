// Match ProductService's paid-plan limit, including its safe fallback.
export function subscriptionProductLimit(user) {
  if (user?.isPremium !== true) return 0;
  return Number.isSafeInteger(user.salesUploadLimit) && user.salesUploadLimit > 0
    ? user.salesUploadLimit
    : 3;
}

export function planUndraft(user, products, candidateIds) {
  const limit = subscriptionProductLimit(user);
  // Missing legacy flags are counted conservatively so they cannot bypass limits.
  const active = products.filter(p => p.draft !== true && p.sold !== true).length;
  let remaining = Math.max(0, limit - active);
  const drafts = products.filter(p => p.draft === true && (!candidateIds || candidateIds.has(p.id)))
    .sort((a, b) => a.id.localeCompare(b.id));
  const selected = limit === 0 ? [] : drafts.filter(product => {
    // Sold products stay sold and do not consume a listing slot.
    if (product.sold === true) return true;
    if (remaining === 0) return false;
    remaining--;
    return true;
  });
  return { limit, active, selected, skipped: drafts.length - selected.length };
}
