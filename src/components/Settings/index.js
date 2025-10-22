"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../AdminSideBar";
import Navbar from "../Nav";
import countries from "world-countries";
import Select from "react-select";
import axios from 'axios';
import { useAuth } from "../../lib/AuthContext"
import { fetchUserPayments, getUserReports, toggleEmailVisibility, cancelanySubscription } from "@/app/api";
import 'bootstrap/dist/js/bootstrap.bundle.min'; // ensure bootstrap JS is loaded

const MyTribes = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const handleTabClick = (tab, e) => {
    e.preventDefault();
    setActiveTab(tab);
  };
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [otherBusiness, setOtherBusiness] = useState("");
  const [emailVisible, setEmailVisible] = useState(true);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [preview, setPreview] = useState(null);
  const [banner, setBannerPreview] = useState(null);
  const [removeprofile, setRemoveProfile] = useState(false);
  const [removebanner, setRemoveBanner] = useState(false);
  const [customIndustry, setCustomIndustry] = useState("");
  const [selectedValueChain, setSelectedValueChain] = useState([]);
  const [customValueChain, setCustomValueChain] = useState("");
  const [selectedBusinessNeeds, setSelectedBusinessNeeds] = useState([]);
  const [reports, setReports] = useState([]);
  const successToastRef = useRef(null);
  const errorToastRef = useRef(null);
  const showToast = (ref) => {
    const toast = new bootstrap.Toast(ref.current);
    toast.show();
  };

  const [securityData, setSecurityData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const { user } = useAuth();
  const userId = user?._id; // Extract user ID
  const token = typeof window !== "undefined" ? localStorage.getItem("access-token") : null;
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    if (userId) {
      const loadPayments = async () => {
        try {
          const paymentsData = await fetchUserPayments(userId);
          setPayments(paymentsData.payments);
        } catch (error) {
        }
      };

      loadPayments();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadReports = async () => {
      try {
        const { reports } = await getUserReports(userId);
        setReports(reports);
      } catch (error) {
      }
    };

    loadReports();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadEmailVisibility = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Adjust these access paths to match your API shape:
        // e.g., if response is { success, data: { user: { email_visibility } } }
        const vis = res.data.email_visibility;
        // Default to true if vis is undefined or null:
        setEmailVisible(vis);
      } catch (err) {
        // On error, you might still default to true:
        setEmailVisible(true);
      }
    };

    loadEmailVisibility();
  }, [userId, token]);


  const handleToggleEmailVisibility = async () => {
    try {
      const res = await toggleEmailVisibility(token);
      // Suppose toggle returns { success, data: { email_visibility } }
      const vis = res.data.email_visibility;
      setEmailVisible(vis);
      showToast(successToastRef);
    } catch (error) {
      showToast(errorToastRef);
    }
  };


  const continents = [
    { value: "North America", label: "North America" },
    { value: "South America", label: "South America" },
    { value: "Europe", label: "Europe" },
    { value: "Asia", label: "Asia" },
    { value: "Africa", label: "Africa" },
    { value: "Oceania", label: "Oceania" },
    { value: "Global", label: "🌎 Global" }, // Special global option
  ];
  const [userData, setUserData] = useState({
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    aboutme: "",
    primary_business: "",
    country: "",
    business_industry: [],
    value_chainstake: [],
    markets_covered: [],
    immediate_needs: [],
    facebook_link: "",
    linkedin_link: "",
    instagram_link: "",
    x_link: "",
    web_link: "",
    profile_pic: "",
    display_banner: "",
  });

  const handleRemove = (type) => {
    if (type === "profile") {
      setPreview(null);
      setUserData((prev) => ({ ...prev, profile_pic: null }));
    } else if (type === "banner") {
      setBannerPreview(null);
      setUserData((prev) => ({ ...prev, display_banner: null }));
    }
  };

  useEffect(() => {
    if (user) {

      setUserData({
        id: user._id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        username: user.username || "",
        aboutme: user.aboutme || "",
        business_country: user.business_country || "",
        primary_business: user.primary_business || "",
        country: user.country || "",
        business_industry: user.business_industry || [],
        value_chainstake: user.value_chainstake || [],
        markets_covered: user.markets_covered || [],
        immediate_needs: user.immediate_needs || [],
        facebook_link: user.facebook_link || "",
        linkedin_link: user.linkedin_link || "",
        instagram_link: user.instagram_link || "",
        x_link: user.x_link || "",
        web_link: user.web_link || "",
        profile_pic: user.profile_pic || "",
        display_banner: user.display_banner || "",
      });
    }
  }, [user]); // Runs when `user` changes

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      // Handle file input
      const objectUrl = URL.createObjectURL(files[0]);

      if (name === "profile_pic") {
        setPreview(objectUrl);
      } else if (name === "banner_image") {
        setBannerPreview(objectUrl);
      }

      // Store the file object in state
      setUserData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      // Handle normal text input
      setUserData((prev) => ({ ...prev, [name]: value }));
    }
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      // Append each field from userData to FormData
      for (const key in userData) {
        if (userData.hasOwnProperty(key)) {
          formData.append(key, userData[key]);
        }
      }
      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/auth/update-user-info`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      successToastRef.current.querySelector(".toast-body").innerText = "Profile updated successfully!";
      showToast(successToastRef);
    } catch (error) {
      successToastRef.current.querySelector(".toast-body").innerText = error;
      showToast(errorToastRef);
    }
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      successToastRef.current.querySelector(".toast-body").innerText = "New password and confirm password do not match.";
      showToast(errorToastRef);
      return;
    }
    try {
      const payload = {
        id: user._id,
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword,
      };
      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/auth/update-user-info`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      successToastRef.current.querySelector(".toast-body").innerText = "Password updated successfully!";
      showToast(successToastRef);
      setSecurityData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {

      successToastRef.current.querySelector(".toast-body").innerText = error;
      showToast(errorToastRef);
    }
  };

  // Account Settings state (for username, password, and privacy)
  const [accountSettings, setAccountSettings] = useState({
    id: user._id,
    username: "",
    privacy: "public", // default privacy
  });
  // Privacy toggle states
  const [publicVisibility, setPublicVisibility] = useState(true);
  const [myTriberVisibility, setMyTriberVisibility] = useState(false);

  // When user is fetched, update account settings as well.
  useEffect(() => {
    if (user) {
      setAccountSettings((prev) => ({
        ...prev,
        username: user.username || "",
        privacy: user.privacy || "public",
      }));
      // Set toggles based on user privacy
      if (user.privacy === "public") {
        setPublicVisibility(true);
        setMyTriberVisibility(false);
      } else if (user.privacy === "triber_only") {
        setPublicVisibility(false);
        setMyTriberVisibility(true);
      } else {
        setPublicVisibility(false);
        setMyTriberVisibility(false);
      }
    }
  }, [user]);

  const handleAccountSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setAccountSettings((prev) => ({ ...prev, [name]: checked }));
    } else {
      setAccountSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCancelSubscription = async (id) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      await cancelanySubscription(id);
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


  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    // Determine privacy based on toggles.
    let privacy = "public";
    if (!publicVisibility) {
      privacy = myTriberVisibility ? "triber_only" : "private";
    }
    // Validate password change if provided.
    if (accountSettings.newPassword) {
      if (accountSettings.newPassword !== accountSettings.confirmPassword) {
        successToastRef.current.querySelector(".toast-body").innerText = "New password and confirm password do not match.";
        showToast(errorToastRef);
        return;
      }
    }
    // Build payload for account settings update.
    const payload = {
      id: userId,
      username: accountSettings.username,
      privacy,
    };
    if (accountSettings.newPassword) {
      payload.newPassword = accountSettings.newPassword;
      // Optionally, include oldPassword if your backend uses it.
      // payload.oldPassword = accountSettings.oldPassword;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/auth/update-user-info`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      successToastRef.current.querySelector(".toast-body").innerText = "Account settings updated successfully!";
      showToast(successToastRef);
    } catch (error) {

      successToastRef.current.querySelector(".toast-body").innerText = "Failed to update account settings.";
      showToast(errorToastRef);
    }
  };

  const countryList = countries
    .map((country) => ({ value: country.name.common, label: country.name.common }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

  const marketsOptions = [
    { label: "🌍 Continents", options: continents },
    { label: "🌎 Countries", options: countryList },
  ];
  const estabishmentcountryList = countries
    .map((country) => country.name.common)
    .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  const businessOptions = [
    "Startup Founder", "Business Consultant", "Franchise Owner", "E-commerce Entrepreneur",
    "Dropshipping Specialist", "Social Commerce Seller", "Software Developer", "IT Consultant",
    "Cybersecurity Expert", "AI & Machine Learning Specialist", "Blockchain Developer",
    "Data Scientist", "UI/UX Designer", "Web Developer", "Mobile App Developer", "Manufacturer",
    "Product Designer", "Factory Owner", "Supplier", "Quality Assurance Specialist",
    "Research & Development (R&D) Specialist", "Product Development Consultant",
    "Innovation Strategist", "Digital Marketer", "Social Media Manager", "SEO Specialist",
    "Affiliate Marketer", "Brand Strategist", "Sales Executive", "Growth Hacker", "Accountant",
    "Financial Consultant", "Venture Capitalist", "Investor", "Wealth Manager", "Insurance Broker",
    "Real Estate Agent", "Property Developer", "Construction Engineer", "Interior Designer",
    "Transporter", "Logistics Manager", "Freight Forwarder", "Import/Export Trader",
    "Legal Consultant", "Compliance Officer", "Contract Specialist", "Business Lawyer",
    "Wholesaler", "Retail Store Owner", "Vendor/Distributor", "Content Creator", "Influencer",
    "Podcaster", "Blogger", "Video Producer", "Public Relations Specialist", "Healthcare Consultant",
    "Fitness Trainer", "Nutritionist", "Wellness Coach", "Graphic Designer", "Photographer",
    "Animator", "Musician", "Fashion Designer", "Coach/Mentor", "Trainer", "Course Creator",
    "Renewable Energy Specialist", "Sustainability Consultant", "Agripreneur", "Farm Owner",
    "Agro-Tech Specialist", "Other"
  ];

  const industries = [
    "Technology", "Automobile", "Healthcare", "Manufacturing", "E-commerce",
    "Real Estate", "Finance & Banking", "Education & Training", "Other"
  ];

  const valueChainOptions = [
    "Manufacturer", "Distributor", "Marketer", "Supplier", "Retailer", "Other"
  ];

  const businessNeedsOptions = [
    "Funding", "Mentorship", "Business Partnerships", "Technology Support"
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 10;

  // Calculate total pages
  const totalPages = Math.ceil(payments.length / paymentsPerPage);

  // Get payments for the current page
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = payments.slice(indexOfFirstPayment, indexOfLastPayment);


  const handleIndustryChange = (industry) => {
    if (industry === "Other") {
      setSelectedIndustries((prev) =>
        prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
      );
    } else {
      setSelectedIndustries((prev) =>
        prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
      );
    }
  };

  const handleValueChainChange = (option) => {
    if (option === "Other") {
      setSelectedValueChain((prev) =>
        prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option]
      );
    } else {
      setSelectedValueChain((prev) =>
        prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option]
      );
    }
  };

  const handleBusinessNeedsChange = (option) => {
    setSelectedBusinessNeeds((prev) =>
      prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option]
    );
  };


  return (
    <>
      {/*<Navbar />*/}

      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css"
        />

        <div className="main-panel">
          <div className="settings-container">
            <div className="container">
              {/* Breadcrumb */}
              <div className="row settings-gutters-sm">
                <div className="col-md-4 d-none d-md-block">
                  <div className="card">
                    <div className="card-body">
                      <nav className="nav flex-column nav-pills settings-nav-gap-y-1">
                        <a
                          href="#profile"
                          onClick={(e) => handleTabClick("profile", e)}
                          className={`nav-item nav-link settings-has-icon settings-nav-link-faded ${activeTab === "profile" ? "active" : ""
                            }`}
                        >
                          <i className="mdi mdi-account mr-2" style={{ fontSize: 24 }}></i>
                          Profile Information
                        </a>
                        <a
                          href="#account"
                          onClick={(e) => handleTabClick("account", e)}
                          className={`nav-item nav-link settings-has-icon settings-nav-link-faded ${activeTab === "account" ? "active" : ""
                            }`}
                        >
                          <i className="mdi mdi-cog mr-2" style={{ fontSize: 24 }}></i>
                          Account Settings
                        </a>
                        <a
                          href="#security"
                          onClick={(e) => handleTabClick("security", e)}
                          className={`nav-item nav-link settings-has-icon settings-nav-link-faded ${activeTab === "security" ? "active" : ""
                            }`}
                        >
                          <i className="mdi mdi-shield-lock-outline mr-2" style={{ fontSize: 24 }}></i>
                          Security
                        </a>
                        <a
                          href="#billing"
                          onClick={(e) => handleTabClick("billing", e)}
                          className={`nav-item nav-link settings-has-icon settings-nav-link-faded ${activeTab === "billing" ? "active" : ""
                            }`}
                        >
                          <i className="mdi mdi-credit-card-outline mr-2" style={{ fontSize: 24 }}></i>
                          Billing
                        </a>
                        <a
                          href="#status"
                          onClick={(e) => handleTabClick("status", e)}
                          className={`nav-item nav-link settings-has-icon settings-nav-link-faded ${activeTab === "status" ? "active" : ""
                            }`}
                        >
                          <i className="mdi mdi-alert-circle-outline mr-2" style={{ fontSize: 24 }}></i>
                          Support
                        </a>

                      </nav>
                    </div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="card">
                    <div className="card-header border-bottom mb-3 d-flex d-md-none">
                      <ul
                        className="nav nav-tabs card-header-tabs settings-nav-gap-x-1"
                        role="tablist"
                      >
                        <li className="nav-item">
                          <a
                            href="#profile"
                            onClick={(e) => handleTabClick("profile", e)}
                            className={`nav-link settings-has-icon ${activeTab === "profile" ? "active" : ""
                              }`}
                          >
                            <i className="mdi mdi-account" style={{ fontSize: 24 }}></i>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#account"
                            onClick={(e) => handleTabClick("account", e)}
                            className={`nav-link settings-has-icon ${activeTab === "account" ? "active" : ""
                              }`}
                          >
                            <i className="mdi mdi-cog" style={{ fontSize: 24 }}></i>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#security"
                            onClick={(e) => handleTabClick("security", e)}
                            className={`nav-link settings-has-icon ${activeTab === "security" ? "active" : ""
                              }`}
                          >
                            <i className="mdi mdi-shield-lock-outline" style={{ fontSize: 24 }}></i>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            href="#billing"
                            onClick={(e) => handleTabClick("billing", e)}
                            className={`nav-link settings-has-icon ${activeTab === "billing" ? "active" : ""
                              }`}
                          >
                            <i className="mdi mdi-credit-card-outline" style={{ fontSize: 24 }}></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div className="card-body tab-content">
                      <div className={`tab-pane ${activeTab === "profile" ? "active" : ""}`} id="profile">
                        <h6>YOUR PROFILE INFORMATION</h6>
                        <hr />
                        <form onSubmit={handleSubmit}>
                          {/* First Name */}
                          <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="firstName"
                              name="firstName"
                              placeholder="Enter your first name"
                              value={userData.firstName}
                              onChange={handleChange}
                            />
                          </div>

                          {/* Last Name */}
                          <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="lastName"
                              name="lastName"
                              placeholder="Enter your last name"
                              value={userData.lastName}
                              onChange={handleChange}
                            />
                          </div>

                          <div className="form-group row align-items-center">
                            <label htmlFor="email" className="col-sm-2 col-form-label">
                              Email
                            </label>
                            <div className="col-sm-6">
                              <input
                                type="text"
                                className="form-control"
                                id="email"
                                name="email"
                                value={userData.email}
                                onChange={handleChange}
                                disabled
                              />
                            </div>
                            <div className="col-sm-4 d-flex align-items-center">
                              <div className="form-check form-switch mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="emailVisibilitySwitch"
                                  checked={emailVisible}
                                  onChange={handleToggleEmailVisibility}
                                />
                                <label
                                  className="form-check-label ms-2"
                                  htmlFor="emailVisibilitySwitch"
                                >
                                  {emailVisible ? "Visible" : "Hidden"}
                                </label>
                              </div>
                            </div>
                          </div>



                          {/* About Me */}
                          <div className="form-group">
                            <label htmlFor="aboutme">About Me</label>
                            <textarea
                              className="form-control settings-autosize"
                              id="aboutme"
                              name="aboutme"
                              placeholder="Write something about you"
                              value={userData.aboutme}
                              onChange={handleChange}
                            ></textarea>
                          </div>

                          {/* Profile Picture */}
                          <div className="form-group">
                            <label htmlFor="profilePicture">Profile Picture</label>
                            <input
                              type="file"
                              className="form-control-file"
                              id="profile_pic"
                              name="profile_pic"
                              accept="image/*"
                              onChange={handleChange}
                            />
                            {preview || userData.profile_pic ? (
                              <div style={{ marginTop: "10px" }}>
                                <img
                                  src={preview || userData.profile_pic}
                                  alt="Profile Preview"
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "cover",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemove("profile")}
                                  style={{
                                    display: "block",
                                    marginTop: "5px",
                                    background: "red",
                                    color: "white",
                                    border: "none",
                                    padding: "5px 10px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ) : null}
                          </div>

                          {/* Banner Image */}
                          <div className="form-group">
                            <label htmlFor="banner">Display Banner</label>
                            <input
                              type="file"
                              className="form-control-file"
                              id="banner"
                              name="banner_image"
                              accept="image/*"
                              onChange={handleChange}
                            />
                            {banner || userData.display_banner ? (
                              <div style={{ marginTop: "10px" }}>
                                <img
                                  src={banner || userData.display_banner}
                                  alt="Banner Preview"
                                  style={{
                                    width: "300px",
                                    height: "200px",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemove("banner")}
                                  style={{
                                    display: "block",
                                    marginTop: "5px",
                                    background: "red",
                                    color: "white",
                                    border: "none",
                                    padding: "5px 10px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ) : null}
                          </div>

                          {/* Business Link */}
                          <div className="form-group">
                            <label htmlFor="web_link">Business Link</label>
                            <input
                              type="url"
                              className="form-control"
                              id="web_link"
                              name="web_link"
                              placeholder="Enter your website or social media link"
                              value={userData.web_link}
                              onChange={handleChange}
                            />
                          </div>

                          {/* Primary Business */}
                          <div className="form-group">
                            <label htmlFor="primary_business">Primary Business</label>
                            <select
                              className="form-control"
                              id="primary_business"
                              name="primary_business"
                              value={userData.primary_business}
                              onChange={handleChange}
                            >
                              {businessOptions.map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Country of Establishment */}
                          <div className="form-group">
                            <label htmlFor="country">User Country</label>
                            <select
                              className="form-control"
                              id="country"
                              name="country"
                              value={userData.country}
                              onChange={handleChange}
                            >
                              <option value="">Select a country...</option>
                              {estabishmentcountryList.map((country, index) => (
                                <option key={index} value={country}>
                                  {country}
                                </option>
                              ))}
                              <option value="Global">🌍 Global</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label htmlFor="country">Country of Establishment</label>
                            <select
                              className="form-control"
                              id="business_country"
                              name="business_country"
                              value={userData.business_country}
                              onChange={handleChange}
                            >
                              <option value="">Select a country...</option>
                              {estabishmentcountryList.map((country, index) => (
                                <option key={index} value={country}>
                                  {country}
                                </option>
                              ))}
                              <option value="Global">🌍 Global</option>
                            </select>
                          </div>

                          {/* Business Industry */}
                          <div className="form-group">
                            <label htmlFor="business_industry">Business Industry</label>
                            <Select
                              isMulti
                              options={industries.map((industry) => ({ value: industry, label: industry }))}
                              value={userData.business_industry.map((industry) => ({ value: industry, label: industry }))}
                              onChange={(selected) =>
                                setUserData({ ...userData, business_industry: selected.map((s) => s.value) })
                              }
                            />
                          </div>

                          {/* Value-Chain Stake */}
                          <div className="form-group">
                            <label>Value-Chain Stake</label>
                            <Select
                              isMulti
                              options={valueChainOptions.map((option) => ({ value: option, label: option }))}
                              value={userData.value_chainstake.map((option) => ({ value: option, label: option }))}
                              onChange={(selected) =>
                                setUserData({ ...userData, value_chainstake: selected.map((s) => s.value) })
                              }
                            />
                          </div>

                          {/* Markets Covered */}
                          <div className="form-group">
                            <label htmlFor="markets_covered">Markets Covered</label>
                            <Select
                              isMulti
                              options={marketsOptions}
                              value={userData.markets_covered.map((market) => ({ value: market, label: market }))}
                              onChange={(selected) =>
                                setUserData({ ...userData, markets_covered: selected.map((s) => s.value) })
                              }
                            />
                          </div>

                          {/* Immediate Business Needs */}
                          <div className="form-group">
                            <label>Immediate Business Needs</label>
                            <Select
                              isMulti
                              options={businessNeedsOptions.map((option) => ({ value: option, label: option }))}
                              value={userData.immediate_needs.map((option) => ({ value: option, label: option }))}
                              onChange={(selected) =>
                                setUserData({ ...userData, immediate_needs: selected.map((s) => s.value) })
                              }
                            />
                          </div>

                          {/* Social Links */}
                          <div className="form-group">
                            <label htmlFor="facebook_link">Facebook Link</label>
                            <input
                              type="url"
                              className="form-control mb-2"
                              id="facebook_link"
                              name="facebook_link"
                              placeholder="Enter your Facebook link"
                              value={userData.facebook_link}
                              onChange={handleChange}
                            />

                            <label htmlFor="instagram_link">Instagram Link</label>
                            <input
                              type="url"
                              className="form-control mb-2"
                              id="instagram_link"
                              name="instagram_link"
                              placeholder="Enter your Instagram link"
                              value={userData.instagram_link}
                              onChange={handleChange}
                            />

                            <label htmlFor="linkedin_link">LinkedIn Link</label>
                            <input
                              type="url"
                              className="form-control mb-2"
                              id="linkedin_link"
                              name="linkedin_link"
                              placeholder="Enter your LinkedIn link"
                              value={userData.linkedin_link}
                              onChange={handleChange}
                            />

                            <label htmlFor="x_link">X (Twitter) Link</label>
                            <input
                              type="url"
                              className="form-control mb-2"
                              id="x_link"
                              name="x_link"
                              placeholder="Enter your X link"
                              value={userData.x_link}
                              onChange={handleChange}
                            />

                            <label htmlFor="web_link">Web Link</label>
                            <input
                              type="url"
                              className="form-control mb-2"
                              id="web_link"
                              name="web_link"
                              placeholder="Enter your X link"
                              value={userData.web_link}
                              onChange={handleChange}
                            />
                          </div>

                          {/* Submit Button */}
                          <button type="submit" className="btn btn-primary">
                            Update Profile
                          </button>
                        </form>
                      </div>


                      <div className={`tab-pane ${activeTab === "account" ? "active" : ""}`} id="account">
                        <h6>ACCOUNT SETTINGS</h6>
                        <hr />
                        <form onSubmit={handleAccountSubmit}>
                          <div className="form-group">
                            <label htmlFor="accountUsername">Username</label>
                            <input
                              type="text"
                              className="form-control"
                              id="accountUsername"
                              name="username"
                              value={accountSettings.username}
                              onChange={handleAccountSettingChange}
                              placeholder="Enter your username"
                            />
                            <small id="usernameHelp" className="form-text text-muted">
                              After changing your username, your old username becomes available for anyone else to claim.
                            </small>
                          </div>
                          <div className="form-group mb-0">
                            <label className="d-block">Privacy Settings</label>
                            <ul className="list-group settings-list-group-sm">
                              <li className="list-group-item settings-has-icon">
                                <div className="custom-control custom-switch">
                                  <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="publicVisibility"
                                    name="publicVisibility"
                                    checked={publicVisibility}
                                    onChange={(e) => setPublicVisibility(e.target.checked)}
                                  />
                                  <label className="custom-control-label" htmlFor="publicVisibility">
                                    Public Visibility
                                  </label>
                                </div>
                              </li>
                            </ul>
                            {!publicVisibility && (
                              <ul className="list-group settings-list-group-sm">
                                <li className="list-group-item settings-has-icon">
                                  <div className="custom-control custom-switch mt-2">
                                    <input
                                      type="checkbox"
                                      className="custom-control-input"
                                      id="myTriberVisibility"
                                      name="myTriberVisibility"
                                      checked={myTriberVisibility}
                                      onChange={(e) => setMyTriberVisibility(e.target.checked)}
                                    />

                                    <label className="custom-control-label" htmlFor="myTriberVisibility">
                                      MyTribers Visibility
                                    </label>
                                  </div>
                                </li>

                              </ul>
                            )}
                            <small className="form-text text-muted">
                              Privacy will be set to:{" "}
                              {publicVisibility ? "Public" : myTriberVisibility ? "Triber Only" : "Private"}
                            </small>
                          </div>
                          <hr />
                          <div className="form-group">
                            <label className="d-block text-danger">Delete Account</label>
                            <p className="text-muted settings-font-size-sm">
                              Once you delete your account, there is no going back. Please be certain.
                            </p>
                          </div>
                          <button className="btn btn-danger" type="button">
                            Delete Account
                          </button>
                          <button type="submit" className="btn btn-primary ml-2">
                            Update Account Settings
                          </button>
                        </form>
                      </div>
                      <div className={`tab-pane ${activeTab === "security" ? "active" : ""}`} id="security">
                        <h6>SECURITY SETTINGS</h6>
                        <hr />
                        <form onSubmit={handleSecuritySubmit}>
                          <div className="form-group">
                            <label className="d-block">Update Password</label>
                            <input
                              type="password"
                              className="form-control"
                              name="oldPassword"
                              placeholder="Enter your old password"
                              value={securityData.oldPassword}
                              onChange={handleSecurityChange}
                            />
                            <input
                              type="password"
                              className="form-control mt-1"
                              name="newPassword"
                              placeholder="New password"
                              value={securityData.newPassword}
                              onChange={handleSecurityChange}
                            />
                            <input
                              type="password"
                              className="form-control mt-1"
                              name="confirmPassword"
                              placeholder="Confirm new password"
                              value={securityData.confirmPassword}
                              onChange={handleSecurityChange}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary">
                            Update Password
                          </button>
                        </form>
                      </div>
                      <div className="tab-content mt-4">
                        {/* Billing Settings */}
                        <div className={`tab-pane ${activeTab === "billing" ? "active" : ""}`} id="billing">
                          <h6>BILLING SETTINGS</h6>
                          {user.subscription !== "none" && (
                            <>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancelSubscription(user._id)}
                              >
                                Cancel Subscription
                              </button>
                              <Link
                                className="btn btn-primary btn-sm ml-2"
                                href="/profile/change-card" // Trigger modal visibility
                              >
                                Change Card
                              </Link>

                            </>
                          )}
                          <hr />

                          {/* Payment History Table */}
                          {payments.length > 0 ? (
                            <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}>
                              <table className="table table-striped">
                                <thead className="thead-dark">
                                  <tr>
                                    <th className="text-center">#</th>
                                    <th>Payment ID</th>
                                    <th>User</th>
                                    <th>Type</th>
                                    <th>Info</th>
                                    <th>Amount ($)</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentPayments.map((payment, index) => {
                                    let packageType = "Unknown";
                                    try {
                                      packageType = payment.data;
                                    } catch (error) {
                                    }

                                    return (
                                      <tr key={payment._id}>
                                        <td>{indexOfFirstPayment + index + 1}</td>
                                        <td>{payment.paymentid || "N/A"}</td>
                                        <td>{payment.user.username || "N/A"}</td>
                                        <td>{packageType}</td>
                                        <td>
                                          {/* Show different values based on payment.data */}
                                          {packageType === "basic" || packageType === "premium"
                                            ? payment.period || "N/A"
                                            : packageType === "course"
                                              ? payment.courseTitle || "N/A"
                                              : packageType === "small" || packageType === "large" || packageType === "custom"
                                                ? payment.tokens || "N/A"
                                                : "N/A"
                                          }
                                        </td>
                                        <td>{payment.payment.toFixed(2) || "N/A"}</td>
                                        <td>{new Date(payment.createdAt).toLocaleString()}</td>
                                        <td>
                                          <span
                                            className={`badge ${payment.status === "paid"
                                              ? "bg-success"
                                              : payment.status === "refunded"
                                                ? "bg-danger"
                                                : payment.status === "pending"
                                                  ? "bg-warning"
                                                  : "bg-secondary"
                                              }`}
                                          >
                                            {payment.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="border border-gray-500 p-3 text-center text-sm">
                              You have not made any payment.
                            </div>
                          )}

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-3">
                              <nav>
                                <ul className="pagination">
                                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                      Previous
                                    </button>
                                  </li>
                                  {Array.from({ length: totalPages }, (_, i) => (
                                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                        {i + 1}
                                      </button>
                                    </li>
                                  ))}
                                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                      Next
                                    </button>
                                  </li>
                                </ul>
                              </nav>
                            </div>
                          )}
                        </div>
                        <div className={`tab-pane ${activeTab === "status" ? "active" : ""}`} id="status">
                          <h6>SUPPORT REPORT STATUS</h6>
                          <hr />

                          {reports.length > 0 ? (
                            <div
                              className="table-responsive"
                              style={{ maxHeight: "400px", overflowY: "auto" }}
                            >
                              <table className="table table-striped">
                                <thead className="thead-dark">
                                  <tr>
                                    <th>Ticket #</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Note</th>
                                    <th>Created At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reports.map((r, i) => (
                                    <tr key={r._id}>
                                      <td>{r.tickno}</td>
                                      <td>{r.type}</td>
                                      <td>
                                        <div
                                          style={{
                                            maxHeight: "80px",
                                            overflowY: "auto",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            padding: "4px",
                                          }}
                                        >
                                          {r.Description}
                                        </div>
                                      </td>

                                      <td>
                                        <span
                                          className={`badge ${r.status === "resolved"
                                            ? "bg-success"
                                            : r.status === "pending"
                                              ? "bg-warning"
                                              : "bg-secondary"
                                            }`}
                                        >
                                          {r.status}
                                        </span>
                                      </td>
                                      <td>
                                        <div
                                          style={{
                                            maxHeight: "80px",
                                            overflowY: "auto",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            padding: "4px",
                                          }}
                                        >
                                          {r.Note}
                                        </div>
                                      </td>
                                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="border border-gray-500 p-3 text-center text-sm">
                              You haven’t submitted any support reports.
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* End Breadcrumb and Tabs */}
            </div>
          </div>
        </div>
      </div>
      <div
        ref={successToastRef}
        className="toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-4"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div className="toast-body">Action succeeded.</div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>

      {/* Error Toast */}
      <div
        ref={errorToastRef}
        className="toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-4"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div className="toast-body">Action failed.</div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </>
  );
};

export default MyTribes;
