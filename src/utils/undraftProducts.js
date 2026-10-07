import { collection, doc, getDocsFromServer, query, runTransaction, where } from 'firebase/firestore';
import { planUndraft } from './productPublishingPolicy';

export async function undraftProducts(db, uid, candidateIds, onProgress) {
  const pending = new Set(candidateIds);
  let updated = 0;
  while (pending.size > 0) {
    const snapshot = await getDocsFromServer(
      query(collection(db, 'products'), where('sellerId', '==', uid)),
    );
    const published = await runTransaction(db, async transaction => {
      // Read again inside the transaction to retry if the subscription or any
      // existing product changes while the batch is being prepared.
      const user = await transaction.get(doc(db, 'users', uid));
      const snapshots = await Promise.all(snapshot.docs.map(p => transaction.get(p.ref)));
      const products = snapshots.filter(p => p.exists())
        .map(p => ({ ...p.data(), id: p.id, ref: p.ref }))
        .filter(p => p.sellerId === uid);
      const plan = planUndraft(user.exists() ? user.data() : null, products, pending);
      if (!plan.limit) throw new Error('This user no longer has an active subscription.');
      const selected = plan.selected.slice(0, 400);
      for (const product of selected) {
        // Preserve the original upload timestamp and the listing's feed position.
        transaction.update(product.ref, { draft: false });
      }
      return selected.map(p => p.id);
    });
    if (published.length === 0) break;
    published.forEach(id => pending.delete(id));
    updated += published.length;
    onProgress(updated);
  }
  return updated;
}
