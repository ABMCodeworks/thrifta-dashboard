import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Live dashboard counters via Firestore `onSnapshot`.
 * Returns { stats, reportCounts, loading, error }.
 *
 * `loading` stays true until the first snapshot of every counter arrives, so
 * the UI can show skeletons instead of a premature 0. Snapshot errors are
 * surfaced via `error` instead of being silently swallowed.
 */
export default function useDashboardStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    premiumUsers: 0,
    premiumPlusUsers: 0,
    totalProducts: 0,
    soldProducts: 0,
  });
  const [reportCounts, setReportCounts] = useState({
    users: 0,
    products: 0,
    ratings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const subs = [];
    const pending = new Set();

    const track = (refQuery, key, setter, id) => {
      pending.add(id);
      const unsub = onSnapshot(
        refQuery,
        (snap) => {
          setter((prev) => ({ ...prev, [key]: snap.size }));
          pending.delete(id);
          if (pending.size === 0) setLoading(false);
        },
        (err) => {
          console.error(`dashboard counter "${id}" failed`, err);
          setError(err);
          pending.delete(id);
          if (pending.size === 0) setLoading(false);
        },
      );
      subs.push(unsub);
    };

    const usersByPlan = (plan) =>
      query(collection(db, "users"), where("subscriptionEntitlementId", "==", plan));

    track(collection(db, "users"), "totalUsers", setStats, "totalUsers");
    track(usersByPlan("thrifta_pro"), "proUsers", setStats, "proUsers");
    track(usersByPlan("thrifta_premium"), "premiumUsers", setStats, "premiumUsers");
    track(
      usersByPlan("thrifta_premium_plus"),
      "premiumPlusUsers",
      setStats,
      "premiumPlusUsers",
    );
    track(collection(db, "products"), "totalProducts", setStats, "totalProducts");
    track(
      query(collection(db, "products"), where("sold", "==", true)),
      "soldProducts",
      setStats,
      "soldProducts",
    );

    // Collection names must match the report pages (user_reports / rating_reports
    // / product_reports). The previous counters used "userReports"/"ratingReports"
    // which never matched the data, so those counts always read 0.
    track(collection(db, "user_reports"), "users", setReportCounts, "userReports");
    track(
      collection(db, "product_reports"),
      "products",
      setReportCounts,
      "productReports",
    );
    track(
      collection(db, "rating_reports"),
      "ratings",
      setReportCounts,
      "ratingReports",
    );

    return () => subs.forEach((u) => u());
  }, []);

  return { stats, reportCounts, loading, error };
}
