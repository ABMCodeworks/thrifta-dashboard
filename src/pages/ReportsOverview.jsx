import React from "react";
import ReportCard from "../components/ReportCard";
import useDashboardStats from "../hooks/useDashboardStats";

export default function ReportsOverview() {
  const { reportCounts, loading } = useDashboardStats();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Review and action user, product, and rating reports.
      </p>
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
    </div>
  );
}
