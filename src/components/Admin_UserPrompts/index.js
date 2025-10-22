"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../Admin_Sidebar";
import Navbar from "../Admin_Nav";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Resources from "../Admin_Scripts";
import { fetchUserPrompts, fetchMe } from "@/app/api";
import "../../styles/admin_assets/bundles/datatables/datatables.min.css";
import "../../styles/admin_assets/bundles/datatables/DataTables-1.10.16/css/dataTables.bootstrap4.min.css";

const UserPrompts = () => {
  const [me, setMe] = useState(null);
  const router = useRouter();
  const [loading3, setLoading3] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [prompts, setPrompts] = useState([]);

  // Fetch current user on mount
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
      if (me && (me.level !== "super" && me.level !== "ai")) {
        router.push("/admin/opulententrepreneurs/open/dashboard");
      } else {
        setLoading2(false);
      }
    }
  }, [me, loading3]);

  // Fetch and sort prompts
  useEffect(() => {
    const getPrompts = async () => {
      try {
        const data = await fetchUserPrompts();
        const sortedPrompts = data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPrompts(sortedPrompts);
        console.log(sortedPrompts);
      } catch (error) {
        console.error("Error fetching user prompts:", error);
      }
    };
    getPrompts();
  }, []);

  // Initialize DataTables after prompts load
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.$ &&
      window.$.fn &&
      window.$.fn.DataTable
    ) {
      if (window.$.fn.DataTable.isDataTable("#table-1")) {
        window.$("#table-1").DataTable().destroy();
      }
      window.$("#table-1").DataTable();
    }
  }, [prompts]);

  if (loading2) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <Resources />
      <Script
        src="/assets/admin_assets/bundles/datatables/datatables.min.js"
        strategy="afterInteractive"
      />
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
                        <h4>User Prompts</h4>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-striped" id="table-1">
                            <thead>
                              <tr>
                                <th className="text-center">#</th>
                                <th>User</th>
                                <th>Total Tokens Used</th>
                                <th>Created At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prompts.map((prompt, index) => (
                                <tr key={prompt._id || index}>
                                  <td className="text-center">{index + 1}</td>
                                  <td>
                                    {prompt.user ? (
                                      <a href={`/profile/tribers/${prompt.userId}`}>
                                        {prompt.user.username}
                                      </a>
                                    ) : (
                                      "Unknown User" // Fallback if the user is null
                                    )}
                                  </td>
                                  <td>{prompt.tokens_used}</td>
                                  <td>{new Date(prompt.createdAt).toLocaleString()}</td>
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
    </>
  );
};

export default UserPrompts;
