"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Admin_Sidebar";
import Navbar from "../Admin_Nav";
import Resources from "../Admin_Scripts";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/app/api";
import "../../styles/admin_assets/css/app.min.css";
import "../../styles/admin_assets/css/components.css";

export default function ImageEditor() {
  const [me, setMe] = useState(null); // <- new state for current user
  const router = useRouter();
  const [loading3, setLoading3] = useState(true);
  const [loading2, setLoading2] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetchMe();
        setMe(response); // assuming response contains user object directly
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setLoading3(false); // <- Move here to ensure it always runs after fetch
      }
    };

    getCurrentUser();
  }, []);
  useEffect(() => {
    if (!loading3) {
      if (me && (me.level !== "super" && me.level !== "community")) {
        router.push("/admin/opulententrepreneurs/open/dashboard");
      } else {
        setLoading2(false); // Only allow render when authorized
      }
    }
  }, [me, loading3]);
  // State for each image URL fetched from backend.
  const [landingImage, setLandingImage] = useState(null);
  const [landingMiniImage, setLandingMiniImage] = useState(null);
  const [dashboardImage, setDashboardImage] = useState(null);

  // File state and preview for each image input.
  const [landingFile, setLandingFile] = useState(null);
  const [landingPreview, setLandingPreview] = useState(null);

  const [landingMiniFile, setLandingMiniFile] = useState(null);
  const [landingMiniPreview, setLandingMiniPreview] = useState(null);

  const [dashboardFile, setDashboardFile] = useState(null);
  const [dashboardPreview, setDashboardPreview] = useState(null);

  // Fetch current images on mount.
  useEffect(() => {
    async function fetchImages() {
      try {
        const resLanding = await axios.get(`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/images/get-landing`);
        setLandingImage(resLanding.data.landingimg);

        const resLandingMini = await axios.get(`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/images/get-landingmini`);
        setLandingMiniImage(resLandingMini.data.landingminiimg);

        const resDashboard = await axios.get(`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/images/get-dashboard`);
        setDashboardImage(resDashboard.data.dashboardimg);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    }
    fetchImages();
  }, []);

  // Handlers for file changes: update file state and preview.
  const handleLandingFileChange = (e) => {
    const file = e.target.files[0];
    setLandingFile(file);
    if (file) {
      setLandingPreview(URL.createObjectURL(file));
    }
  };

  const handleLandingMiniFileChange = (e) => {
    const file = e.target.files[0];
    setLandingMiniFile(file);
    if (file) {
      setLandingMiniPreview(URL.createObjectURL(file));
    }
  };

  const handleDashboardFileChange = (e) => {
    const file = e.target.files[0];
    setDashboardFile(file);
    if (file) {
      setDashboardPreview(URL.createObjectURL(file));
    }
  };

  // Update functions: create FormData and send PUT request to update each image.
  const updateImageField = async (fieldName, file) => {
    try {
      const formData = new FormData();
      // The field name for the file must match what the route expects.
      formData.append(fieldName, file);
      let endpoint = "";
      if (fieldName === "landingimg") {
        endpoint = `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/images/update-landing`;
      } else if (fieldName === "landingminiimg") {
        endpoint = `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/images/update-landingmini`;
      } else if (fieldName === "dashboardimg") {
        endpoint = `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/images/update-dashboard`;
      } // You can add a similar route for dashboard if needed.

      if (!endpoint) return;

      const res = await axios.put(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Update the state with the returned URL.
      if (fieldName === "landingimg") {
        setLandingImage(res.data.landingimg);
        setLandingFile(null);
        setLandingPreview(null);
      } else if (fieldName === "landingminiimg") {
        setLandingMiniImage(res.data.landingminiimg);
        setLandingMiniFile(null);
        setLandingMiniPreview(null);
      }
      else if (fieldName === "dashboardimg") {
        setDashboardImage(res.data.dashboardimg);
        setDashboardFile(null);
        setDashboardFile(null);
      }
      // You can add a similar update for dashboard image.
      alert("Image updated successfully.");
    } catch (error) {
      console.error("Error updating image:", error);
      alert("Failed to update image.");
    }
  };

  if (loading2) {
    return <div className="p-4">Loading...</div>;
  }


  return (
    <>
      <Resources />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/nicescroll/3.7.6/jquery.nicescroll.min.js" strategy="beforeInteractive" />
      <div id="app">
        <div className="main-wrapper main-wrapper-1">
          <div className="navbar-bg"></div>
          <Navbar />
          <Sidebar />
          <div className="main-content">
            <section className="section">
              <div className="section-body">
                {/* Landing Image Section */}
                <div className="row mb-5">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h4>Update Landing Image</h4>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label htmlFor="landing-upload">Landing Image</label>
                          <div id="image-preview" className="image-preview">
                            <label htmlFor="landing-upload" id="image-label">
                              {landingImage ? "Change File" : "Choose File"}
                            </label>
                            <input
                              type="file"
                              id="landing-upload"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleLandingFileChange}
                            />
                            {landingPreview ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}${landingPreview}`}
                                alt="Landing Preview"
                                style={{ width: "200px", marginTop: "10px" }}
                              />
                            ) : landingImage ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}${landingImage}`}
                                alt="Current Landing"
                                style={{ width: "200px", marginTop: "10px" }}
                              />
                            ) : null}
                          </div>
                        </div>
                        {landingFile && (
                          <button
                            className="btn btn-success mt-2"
                            onClick={() => updateImageField("landingimg", landingFile)}
                          >
                            Update Landing Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Landing Mini Image Section */}
                <div className="row mb-5">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h4>Update Landing Video</h4>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label htmlFor="landingmini-upload">Landing Mini Video</label>
                          <div id="image-preview" className="image-preview">
                            <label htmlFor="landingmini-upload" id="image-label">
                              {landingMiniImage ? "Change File" : "Choose File"}
                            </label>
                            <input
                              type="file"
                              id="landingmini-upload"
                              accept="video/mp4, video/webm"
                              onChange={handleLandingMiniFileChange}
                            />
                            {landingMiniPreview ? (
                              <video
                                src={`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}${landingMiniPreview}`}
                                autoPlay
                                muted
                                loop
                                playsInline
                                alt="Landing Mini Preview"
                                style={{ width: "200px", marginTop: "10px" }}
                              />
                            ) : landingMiniImage ? (
                              <video
                                autoPlay
                                muted
                                loop
                                playsInline
                                src={`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}${landingMiniImage}`}
                                alt="Current Landing Mini"
                                style={{ width: "200px", marginTop: "10px" }}
                              />
                            ) : null}
                          </div>
                        </div>
                        {landingMiniFile && (
                          <button
                            className="btn btn-success mt-2"
                            onClick={() => updateImageField("landingminiimg", landingMiniFile)}
                          >
                            Update Landing Mini Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Image Section (Optional) */}
                <div className="row mb-5">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h4>Update Dashboard Image</h4>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label htmlFor="dashboard-upload">Dashboard Image</label>
                          <div id="image-preview" className="image-preview">
                            <label htmlFor="dashboard-upload" id="image-label">
                              {dashboardImage ? "Change File" : "Choose File"}
                            </label>
                            <input
                              type="file"
                              id="dashboard-upload"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleDashboardFileChange}
                            />
                            {dashboardPreview ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}${dashboardPreview}`}
                                alt="Dashboard Preview"
                                style={{ width: "200px", marginTop: "10px" }}
                              />
                            ) : dashboardImage ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}${dashboardImage}`}
                                alt="Current Dashboard"
                                style={{ width: "200px", marginTop: "10px" }}
                              />
                            ) : null}
                          </div>
                        </div>
                        {dashboardFile && (
                          <button
                            className="btn btn-success mt-2"
                            onClick={() => updateImageField("dashboardimg", dashboardFile)}
                          >
                            Update Dashboard Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* End of sections */}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
