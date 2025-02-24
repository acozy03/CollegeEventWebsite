import React from "react";
import { Link } from "react-router-dom";

export default function SuperAdminDashboard() {
  return (
    <div className="super-admin-dashboard">
      <h2>Super Admin Dashboard</h2>
      <nav>
        <ul>
          <li>
            <Link to="/superadmin/create-university">Create University</Link>
          </li>
          <li>
            <Link to="/superadmin/approve-events">Approve Events</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}