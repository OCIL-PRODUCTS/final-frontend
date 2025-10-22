"use client";

import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../Admin_Sidebar";
import Navbar from "../Admin_Nav";
import Script from "next/script";
import Resources from "../Admin_Scripts";
import { useRouter } from "next/navigation";
import {
  fetchAllPayments,
  updatePaymentStatus,
  refundPayment,
  fetchMe,
  cancelSubscription,
} from "@/app/api";
import "datatables.net-bs4";
import "../../styles/admin_assets/bundles/datatables/datatables.min.css";
import "../../styles/admin_assets/bundles/datatables/DataTables-1.10.16/css/dataTables.bootstrap4.min.css";

const Payment = () => {
  const router = useRouter();
  const [loading3, setLoading3] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [me, setMe] = useState(null);

  const [payments, setPayments] = useState([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Track when the DataTables JS has loaded
  const [dtScriptLoaded, setDtScriptLoaded] = useState(false);
  // Prevent re-initializing
  const [dtInitialized, setDtInitialized] = useState(false);

  const dtRef = useRef(null);
  const isSuperAdmin = me?.level === "super";

  // 1) Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetchMe();
        setMe(response);
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setLoading3(false);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!loading3) {
      if (me && me.level !== "super" && me.level !== "finance") {
        router.push("/admin/opulententrepreneurs/open/dashboard");
      } else {
        setLoading2(false);
      }
    }
  }, [me, loading3]);

  const handleCancelSubscription = async (id) => {
  if (!confirm("Are you sure you want to cancel this subscription?")) return;
  try {
    await cancelSubscription(id);
    setPayments(ps =>
      ps.map(p =>
        p._id === id ? { ...p, status: "cancelled" } : p
      )
    );
    alert("Subscription cancelled.");
  } catch (e) {
    console.error(e);
    alert("Failed to cancel subscription.");
  }
};


  // 2) Fetch payments
  useEffect(() => {
    fetchAllPayments()
      .then((res) => {
        setPayments(res.payments);
        setPaymentsLoaded(true); // mark payments as loaded
      })
      .catch((err) => console.error("Error fetching payments:", err));
  }, []);

  // 3) When DataTables script loads, mark it
  const handleDtLoad = () => setDtScriptLoaded(true);

  // 4) Initialize DataTable exactly once, once JS is loaded and row data exists
  useEffect(() => {
    if (
      dtScriptLoaded &&
      paymentsLoaded &&
      payments.length > 0 &&
      !dtInitialized &&
      window.$?.fn?.DataTable
    ) {
      dtRef.current = window.$("#table-1").DataTable({
        order: [[5, "desc"]], // Sort by Date column (index 5) descending
      });
      setDtInitialized(true);
    }
  }, [dtScriptLoaded, paymentsLoaded, payments, dtInitialized]);

  // 5) Clean up on unmount
  useEffect(() => {
    return () => {
      if (dtInitialized && dtRef.current) {
        dtRef.current.destroy(true);
      }
    };
  }, [dtInitialized]);

  // 6) Apply statusFilter via DataTables API
  useEffect(() => {
    if (!dtRef.current) return;

    if (statusFilter === "all") {
      dtRef.current.column(8).search("").draw();
    } else {
      dtRef.current
        .column(8)
        .search(`^${statusFilter}$`, true, false)
        .draw();
    }
  }, [statusFilter]);

  // 7) Handlers
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePaymentStatus(id, newStatus);
      setPayments((ps) =>
        ps.map((p) => (p._id === id ? { ...p, status: newStatus } : p))
      );
      alert("Payment status updated.");
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };

  const handleRefund = async (id) => {
    if (!confirm("Refund this payment?")) return;
    try {
      await refundPayment(id);
      setPayments((ps) =>
        ps.map((p) => (p._id === id ? { ...p, status: "refunded" } : p))
      );
      alert("Refund successful.");
    } catch (e) {
      console.error(e);
      alert("Failed to refund.");
    }
  };

  if (loading2) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <Resources />

      <div id="app">
        <div className="main-wrapper main-wrapper-1">
          <div className="navbar-bg"></div>
          <Navbar />
          <Sidebar />
          <div className="main-content">
            <section className="section">
              <div className="section-body">
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h4>Payments</h4>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label htmlFor="statusFilter" className="form-label">
                            Filter by Status:
                          </label>
                          <select
                            id="statusFilter"
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ maxWidth: "250px" }}
                          >
                            <option value="all">All</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-striped" id="table-1">
                            <thead>
                              <tr>
                                <th>Payment ID</th>
                                <th>User</th>
                                <th>Type</th>
                                <th>Info</th>
                                <th>Amount</th>
                                <th>Discount %</th>
                                <th>Token</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ display: "none" }}>Raw Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>

                            <tbody>
                              {payments.map((p) => (
                                <tr key={p._id}>
                                  <td>{p.paymentid || "N/A"}</td>
                                  <td>{p.user?.username || "N/A"}</td>
                                  <td>{p.data || "N/A"}</td>
                                  <td>
                                    {p.data === "basic" || p.data === "premium"
                                      ? p.period
                                      : p.data === "course"
                                      ? p.courseTitle
                                      : ["small", "large", "custom"].includes(p.data)
                                      ? p.tokens
                                      : "N/A"}
                                  </td>
                                  <td>{p.payment || 0}</td>
                                  <td>{p.discountValue || "N/A"}</td>
                                  <td>{p.discount || "N/A"}</td>
                                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                                  <td>
                                    <select
                                      value={p.status}
                                      onChange={(e) =>
                                        handleStatusChange(p._id, e.target.value)
                                      }
                                      className="form-control"
                                      style={{
                                        minWidth: 120,
                                        backgroundColor:
                                          p.status === "refunded" ? "#f0f0f0" : undefined,
                                        cursor:
                                          p.status === "refunded"
                                            ? "not-allowed"
                                            : undefined,
                                      }}
                                      disabled={p.status === "refunded"}
                                    >
                                      <option value="paid">Paid</option>
                                      <option value="pending">Pending</option>
                                      <option value="refunded">Refunded</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </td>
                                  <td style={{ display: "none" }}>{p.status}</td>
                                 <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
  {/* Cancel Subscription button (only for subs) */}
  {["trial", "basic", "premium"].includes(p.data) && (
    <button
      className="btn btn-warning"
      onClick={() => handleCancelSubscription(p._id)}
      disabled={!isSuperAdmin || p.status !== "paid"}
      style={{
        backgroundColor:
          !isSuperAdmin || p.status !== "paid" ? "grey" : undefined,
        borderColor:
          !isSuperAdmin || p.status !== "paid" ? "grey" : undefined,
        cursor:
          !isSuperAdmin || p.status !== "paid" ? "not-allowed" : undefined,
      }}
    >
      Cancel Subscription
    </button>
  )}

  {/* Refund button */}
  <button
    className="btn btn-info"
    onClick={() => handleRefund(p._id)}
    disabled={p.status === "refunded" || !isSuperAdmin}
    style={{
      backgroundColor:
        p.status === "refunded" || !isSuperAdmin ? "grey" : undefined,
      borderColor:
        p.status === "refunded" || !isSuperAdmin ? "grey" : undefined,
      cursor:
        p.status === "refunded" || !isSuperAdmin ? "not-allowed" : undefined,
    }}
  >
    Refund
  </button>
</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Load DataTables script only after payments have loaded */}
      {paymentsLoaded && (
        <Script
          src="/assets/admin_assets/bundles/datatables/datatables.min.js"
          strategy="afterInteractive"
          onLoad={handleDtLoad}
        />
      )}

      {/* Other scripts */}
      <Script
        src="/assets/admin_assets/bundles/jquery-selectric/jquery.selectric.min.js"
        strategy="beforeInteractive"
      />
    </>
  );
};

export default Payment;
