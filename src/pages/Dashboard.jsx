import React from "react";
import StatCard from "../components/StatCard";
import ReportCard from "../components/ReportCard";
import UserProductSearch from "./UserProductSearch.jsx";
import useDashboardStats from "../hooks/useDashboardStats";

export default function Dashboard() {
  const { stats, reportCounts, loading, error } = useDashboardStats();

  const sellThrough =
    stats.totalProducts > 0
      ? Math.round((stats.soldProducts / stats.totalProducts) * 100)
      : 0;

  // Labels now match the entitlement each card actually queries.
  const userCards = [
    { title: "Total Users", value: stats.totalUsers, icon: "users", accent: "brand" },
    { title: "Pro Users", value: stats.proUsers, icon: "tag", accent: "blue" },
    { title: "Premium Users", value: stats.premiumUsers, icon: "tag", accent: "amber" },
    {
      title: "Premium+ Users",
      value: stats.premiumPlusUsers,
      icon: "tag",
      accent: "violet",
    },
  ];

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          Some live counters failed to load. Check your connection or Firestore
          permissions.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Users
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {userCards.map((c) => (
            <StatCard key={c.title} {...c} loading={loading} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Products
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Products Listed"
            value={stats.totalProducts}
            icon="tag"
            accent="slate"
            loading={loading}
          />
          <StatCard
            title="Products Sold"
            value={stats.soldProducts}
            icon="cart"
            accent="brand"
            loading={loading}
          />
          <StatCard
            title="Sell-through Rate"
            value={`${sellThrough}%`}
            icon="trend"
            accent="violet"
            loading={loading}
            hint={`${stats.soldProducts.toLocaleString()} of ${stats.totalProducts.toLocaleString()} listed`}
          />
        </div>
      </section>

      <UserProductSearch />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Reports
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ReportCard
            title="User Reports"
            to="/reports/users"
            count={reportCounts.users}
            icon="users"
            loading={loading}
          />
          <ReportCard
            title="Product Reports"
            to="/reports/products"
            count={reportCounts.products}
            icon="tag"
            loading={loading}
          />
          <ReportCard
            title="Rating Reports"
            to="/reports/ratings"
            count={reportCounts.ratings}
            icon="reports"
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}
