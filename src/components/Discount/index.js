"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../Admin_Sidebar";
import Navbar from "../Admin_Nav";
import Resources from "../Admin_Scripts";
import { useRouter } from "next/navigation";
import {
  fetchMe,
  fetchDiscounts,
  createDiscount,
  deleteDiscount,
} from "@/app/api";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const DiscountManagement = () => {
  const [me, setMe] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newDiscountFor, setNewDiscountFor] = useState("tokens");
  const [newDiscountCount, setNewDiscountCount] = useState("1");
  const [newDiscountNumberOfUses, setNewDiscountNumberOfUses] = useState("1");
  const [newSubscriptionType, setNewSubscriptionType] = useState("basic"); // New state for subscription type
  const [newPeriod, setNewPeriod] = useState("month"); // New state for period

  const router = useRouter();

  // Load current user
  useEffect(() => {
    (async () => {
      try {
        const response = await fetchMe();
        setMe(response);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    })();
  }, []);

  // Redirect unauthorized
  useEffect(() => {
    if (me && me.level !== "super" && me.level !== "finance") {
      router.push("/admin/opulententrepreneurs/open/dashboard");
    }
  }, [me, router]);

  // Load discounts
  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const res = await fetchDiscounts();
        const arr = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res)
              ? res
              : [];
        setDiscounts(arr);
      } catch (err) {
        console.error("Error loading discounts:", err);
      }
    })();
  }, [me]);

  // Create a new discount
  const handleCreateDiscount = async () => {
    const val = parseFloat(newDiscountValue);
    const cnt = parseInt(newDiscountCount, 10);
    const uses = parseInt(newDiscountNumberOfUses, 10);

    if (isNaN(val) || val < 0 || val > 100) return alert("Enter a valid % value");
    if (!["tokens", "subscription", "course"].includes(newDiscountFor))
      return alert("Select tokens, subscription, or course");
    if (isNaN(cnt) || cnt < 1) return alert("Enter a valid coupon count");
    if (isNaN(uses) || uses < 1) return alert("Enter a valid max uses");

    try {
      const res = await createDiscount({
        value: val,
        for: newDiscountFor,
        count: cnt,
        numberOfUses: uses,
        subscription: newSubscriptionType, // Pass the new subscription type
        period: newPeriod, // Pass the new period
      });
      const created = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      if (created.length > 0) {
        setDiscounts((prev) => [...created, ...prev]);
        setNewDiscountValue("");
        setNewDiscountFor("tokens");
        setNewDiscountCount("1");
        setNewDiscountNumberOfUses("1");
        setNewSubscriptionType("basic"); // Reset subscription type
        setNewPeriod("month"); // Reset period
        alert(`Created ${created.length} coupon(s).`);
      } else {
        alert("No coupons created.");
      }
    } catch {
      alert("Failed to create discount.");
    }
  };

  // Delete a single discount
  const handleDeleteDiscount = async (id) => {
    if (!confirm("Delete this discount?")) return;
    await deleteDiscount(id);
    setDiscounts((prev) => prev.filter((d) => d._id !== id));
    setSelectedDiscounts((sel) => sel.filter((d) => d._id !== id));
  };

  // Bulk delete selected
  const handleDeleteSelected = async () => {
    if (selectedDiscounts.length === 0) {
      return alert("No discounts selected.");
    }
    if (!confirm(`Delete ${selectedDiscounts.length} discount(s)?`)) return;

    // Delete via API
    await Promise.all(
      selectedDiscounts.map((d) => deleteDiscount(d._id))
    );

    // Remove from state
    const ids = selectedDiscounts.map((d) => d._id);
    setDiscounts((prev) => prev.filter((d) => !ids.includes(d._id)));

    // Clear selection
    setSelectedDiscounts([]);
  };

  const renderHeader = () => (
    <IconField iconPosition="left">
      <InputIcon className="pi pi-search" />
      <InputText
        type="search"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search discounts"
      />
    </IconField>
  );

  const usedByListTemplate = (row) => {
    const list = (row.used_by || []).map((u) => u || u._id).join(", ");
    return list ? (
      <span
        style={{ cursor: "pointer", textDecoration: "underline" }}
        onClick={() => alert(`Used by:\n${list}`)}
      >
        View
      </span>
    ) : (
      "-"
    );
  };

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
                <h4>Discount Management</h4>

                {/* Create Form */}
                <div className="mb-3 row align-items-end">
                  <div className="col-sm-2">
                    <label className="form-label">Value %</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={100}
                      value={newDiscountValue}
                      onChange={(e) => setNewDiscountValue(e.target.value)}
                      placeholder="e.g. 10%"
                    />
                  </div>
                  <div className="col-sm-2">
                    <label className="form-label">For</label>
                    <select
                      className="form-select"
                      value={newDiscountFor}
                      onChange={(e) => setNewDiscountFor(e.target.value)}
                    >
                      <option value="tokens">Tokens</option>
                      <option value="subscription">Subscription</option>
                      <option value="course">Course</option>
                    </select>
                  </div>
                  <div className="col-sm-2">
                    <label className="form-label"># of Coupons</label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      value={newDiscountCount}
                      onChange={(e) => setNewDiscountCount(e.target.value)}
                    />
                  </div>
                  <div className="col-sm-2">
                    <label className="form-label">Max Uses</label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      value={newDiscountNumberOfUses}
                      onChange={(e) => setNewDiscountNumberOfUses(e.target.value)}
                    />
                  </div>

                  {/* Conditionally render Subscription and Period only if 'subscription' is selected */}
                  {newDiscountFor === "subscription" && (
                    <>
                      <div className="col-sm-2">
                        <label className="form-label">Subscription</label>
                        <select
                          className="form-select"
                          value={newSubscriptionType}
                          onChange={(e) => setNewSubscriptionType(e.target.value)}
                        >
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                      <div className="col-sm-2">
                        <label className="form-label">Period</label>
                        <select
                          className="form-select"
                          value={newPeriod}
                          onChange={(e) => setNewPeriod(e.target.value)}
                        >
                          <option value="month">Monthly</option>
                          <option value="year">Yearly</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="col-sm-2">
                    <button className="btn btn-success" onClick={handleCreateDiscount}>
                      Create
                    </button>
                  </div>
                  <div className="col-sm-2">
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteSelected}
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>


                {/* DataTable */}
                <div className="card">
                  <DataTable
                    value={discounts}
                    paginator
                    rows={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    dataKey="_id"
                    selection={selectedDiscounts}
                    onSelectionChange={(e) => setSelectedDiscounts(e.value)}
                    header={renderHeader()}
                    globalFilterFields={[
                      "token",
                      "value",
                      "for",
                      "used_by.username",
                    ]}
                    globalFilter={globalFilter}
                    emptyMessage="No discounts found."
                    tableStyle={{ minWidth: "60rem" }}
                  >
                    <Column
                      selectionMode="multiple"
                      headerStyle={{ width: "3rem" }}
                    />
                    <Column field="token" header="Token" sortable />
                    <Column field="value" header="Value (%)" sortable />
                    <Column
                      field="for"
                      header="For"
                      sortable
                      body={(row) => {
                        if (row.for === "subscription") {
                          return `${row.for.charAt(0).toUpperCase() + row.for.slice(1)} (${row.subscription}, ${row.period})`;
                        }
                        return row.for.charAt(0).toUpperCase() + row.for.slice(1); // Capitalize the first letter for other types
                      }}
                    />

                    <Column
                      header="Used By Count"
                      body={(row) =>
                        Array.isArray(row.used_by) ? row.used_by.length : 0
                      }
                      sortable
                    />
                    <Column
                      header="Used By List"
                      body={usedByListTemplate}
                    />
                    <Column
                      field="numberOfUses"
                      header="Max Uses"
                      sortable
                    />
                    <Column
                      field="createdAt"
                      header="Created At"
                      body={(row) =>
                        new Date(row.createdAt).toLocaleString()
                      }
                      sortable
                    />
                    <Column
                      header="Action"
                      body={(row) => (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteDiscount(row._id)}
                        >
                          Delete
                        </button>
                      )}
                    />
                  </DataTable>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscountManagement;
