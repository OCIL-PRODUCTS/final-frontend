"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../Admin_Sidebar";
import Navbar from "../Admin_Nav";
import Resources from "../Admin_Scripts";
import axios from "axios";
import { TextEditor } from "./TextEditor";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import {
  fetchCoursesArray, fetchMe
} from "@/app/api"; // Import new API functions
import { useRouter } from "next/navigation";

const CreateCourse = () => {
  const router = useRouter();
  const [me, setMe] = useState(null); // <- new state for current user
  const [loading3, setLoading3] = useState(true); // <- new state for current user
  const [loading2, setLoading2] = useState(true); // <- new state for current user
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
  const [formData, setFormData] = useState({
    title: "",
    Author: "",
    AuthorLink: "",
    courseCategory: "",
    description: "",
    shortdescription: "",
    courseContent: "",
    price: "",
  });

  const [tools, setTools] = useState([]);

  // Fetch initial categories (tools) on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchCoursesArray();
        // Assuming response.data is an array of tool categories
        setTools(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Thumbnail file and preview URL.
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // ------------------------------------------------------------
  // LESSON-BASED STATES (matching your updated model)
  // each entry is an object: { lesson: [Number], content: [ ... ] }
  // files.content holds File objects (or null) and limited to 5 per lesson
  // other content arrays hold strings (links)
  // ------------------------------------------------------------
  const [files, setFiles] = useState([{ lesson: [1], content: [null] }]);
  const [videosLinks, setVideoLinks] = useState([{ lesson: [1], content: [""] }]);
  const [assessmentLinks, setAssessmentLinks] = useState([{ lesson: [1], content: [""] }]);
  const [externalLinks, setExternalLinks] = useState([{ lesson: [1], content: [""] }]);
  const [referenceLinks, setReferenceLinks] = useState([{ lesson: [1], content: [""] }]);

  // ------------------------------------------------------------
  // Generic helpers to add a new lesson across all resource arrays
  // ------------------------------------------------------------
  const addLesson = () => {
    // determine next lesson number by looking at files length (safe: all arrays kept in sync)
    const next = Math.max(
      files.length,
      videosLinks.length,
      assessmentLinks.length,
      externalLinks.length,
      referenceLinks.length
    ) + 1;

    setFiles((prev) => [...prev, { lesson: [next], content: [null] }]);
    setVideoLinks((prev) => [...prev, { lesson: [next], content: [""] }]);
    setAssessmentLinks((prev) => [...prev, { lesson: [next], content: [""] }]);
    setExternalLinks((prev) => [...prev, { lesson: [next], content: [""] }]);
    setReferenceLinks((prev) => [...prev, { lesson: [next], content: [""] }]);
  };

  // ------------------------------------------------------------
  // Basic form handlers (unchanged)
  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setThumbnail(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // ------------------------------------------------------------
  // FILES (per-lesson, up to 5 files per lesson)
  // ------------------------------------------------------------
  // change a file for a given lessonIndex and fileIndex
  const handleLessonFileChange = (lessonIndex, fileIndex, e) => {
    const file = e.target.files[0] ?? null;
    setFiles((prev) => {
      const copy = JSON.parse(JSON.stringify(prev)); // deep copy
      // ensure content array exists
      copy[lessonIndex].content = copy[lessonIndex].content || [];
      copy[lessonIndex].content[fileIndex] = file;
      return copy;
    });
  };

  // add a new file slot in a lesson (max 5)
  const addFileToLesson = (lessonIndex) => {
    setFiles((prev) => {
      const copy = [...prev];
      const contentArr = copy[lessonIndex].content || [];
      if (contentArr.length >= 5) return prev; // enforce 5 per lesson
      contentArr.push(null);
      copy[lessonIndex].content = contentArr;
      return copy;
    });
  };

  // remove file slot from a lesson
  const removeFileFromLesson = (lessonIndex, fileIndex) => {
    setFiles((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = (copy[lessonIndex].content || []).filter(
        (_, i) => i !== fileIndex
      );
      return copy;
    });
  };

  // ------------------------------------------------------------
  // LINKS (videos, external, reference, assessment) per lesson
  // each lesson's content is an array of strings (can add multiple)
  // ------------------------------------------------------------
  // Generic function for updating string-list content inside lesson-based arrays
  const handleLessonStringChange = (setter, stateArr, lessonIndex, contentIndex, value) => {
    setter((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = copy[lessonIndex].content || [];
      copy[lessonIndex].content[contentIndex] = value;
      return copy;
    });
  };

  const addStringToLesson = (setter, stateArr, lessonIndex) => {
    setter((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = copy[lessonIndex].content || [];
      copy[lessonIndex].content.push("");
      return copy;
    });
  };

  const removeStringFromLesson = (setter, stateArr, lessonIndex, contentIndex) => {
    setter((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = (copy[lessonIndex].content || []).filter(
        (_, i) => i !== contentIndex
      );
      return copy;
    });
  };

  // These wrappers keep previous function names for consistency with your code
  const handleExternalLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setExternalLinks, externalLinks, lessonIndex, contentIndex, value);
  const addExternalLink = (lessonIndex) =>
    addStringToLesson(setExternalLinks, externalLinks, lessonIndex);
  const removeExternalLink = (lessonIndex, contentIndex) =>
    removeStringFromLesson(setExternalLinks, externalLinks, lessonIndex, contentIndex);

  const handleVideoLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setVideoLinks, videosLinks, lessonIndex, contentIndex, value);
  const addVideoLink = (lessonIndex) =>
    addStringToLesson(setVideoLinks, videosLinks, lessonIndex);
  const removeVideoLink = (lessonIndex, contentIndex) =>
    removeStringFromLesson(setVideoLinks, videosLinks, lessonIndex, contentIndex);

  const handleReferenceLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setReferenceLinks, referenceLinks, lessonIndex, contentIndex, value);
  const addReferenceLink = (lessonIndex) =>
    addStringToLesson(setReferenceLinks, referenceLinks, lessonIndex);
  const removeReferenceLink = (lessonIndex, contentIndex) =>
    removeStringFromLesson(setReferenceLinks, referenceLinks, lessonIndex, contentIndex);

  const handleAssessmentLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setAssessmentLinks, assessmentLinks, lessonIndex, contentIndex, value);
  const addAssessmentLink = (lessonIndex) =>
    addStringToLesson(setAssessmentLinks, assessmentLinks, lessonIndex);
  const removeAssessmentLink = (lessonIndex, contentIndex) =>
    removeStringFromLesson(setAssessmentLinks, assessmentLinks, lessonIndex, contentIndex);

  // ------------------------------------------------------------
  // Helper function to inject inline table borders (unchanged)
  // ------------------------------------------------------------
  const injectTableBorders = (htmlString) => {
    if (!htmlString) return htmlString;
    const container = document.createElement("div");
    container.innerHTML = htmlString;
    container.querySelectorAll("table").forEach((table) => {
      // Append inline style for the table element.
      const currentStyle = table.getAttribute("style") || "";
      const borderStyle = "border: 1px solid #000; border-collapse: collapse;";
      table.setAttribute("style", currentStyle + borderStyle);
      // Also apply border style to all table header cells and data cells.
      table.querySelectorAll("th, td").forEach((cell) => {
        const cellCurrentStyle = cell.getAttribute("style") || "";
        cell.setAttribute("style", cellCurrentStyle + "border: 1px solid #000;");
      });
    });
    return container.innerHTML;
  };

  // ------------------------------------------------------------
  // On form submit: collect files + meta + JSON for other arrays
  // ------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedDescription = injectTableBorders(formData.description);
    const updatedCourseContent = injectTableBorders(formData.courseContent);

    const data = new FormData();

    // Basic text fields
    data.append("title", formData.title);
    data.append("Author", formData.Author);
    data.append("AuthorLink", formData.AuthorLink);
    data.append("price", formData.price);
    data.append("courseCategory", formData.courseCategory);
    data.append("shortdescription", formData.shortdescription);
    data.append("description", updatedDescription);
    data.append("courseContent", updatedCourseContent);

    // Thumbnail
    if (thumbnail) {
      data.append("thumbnail", thumbnail);
    }

    // Files: append actual files to FormData and build a small meta array mapping filenames -> lesson
    const filesMeta = []; // [{ lesson: [n], filename: "x.pdf" }, ...]
    files.forEach((lessonObj) => {
      const lessonNums = lessonObj.lesson || [];
      (lessonObj.content || []).forEach((file) => {
        if (file instanceof File) {
          data.append("files", file); // backend receives all files under "files"
          filesMeta.push({
            lesson: lessonNums,
            filename: file.name,
          });
        }
      });
    });
    // Append files meta so backend can map uploaded files to lesson numbers
    data.append("filesMeta", JSON.stringify(filesMeta));

    // Append other lesson-based resources as JSON
    data.append("videosLinks", JSON.stringify(videosLinks));
    data.append("externalLinks", JSON.stringify(externalLinks));
    data.append("referenceLinks", JSON.stringify(referenceLinks));
    data.append("assessmentLinks", JSON.stringify(assessmentLinks));
    data.append("filesLessonsShape", JSON.stringify(
      // If you want to also send the structure of files (lessons + placeholders) as JSON
      files.map(f => ({ lesson: f.lesson, contentNames: (f.content || []).map(c => (c instanceof File ? c.name : null)) }))
    ));

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/course`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Course created successfully.");
      // Optionally, reset the form or redirect here.
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Error creating course.");
    }
  };

  if (loading2) {
    return <div className="p-4">Loading...</div>;
  }

  // ------------------------------------------------------------
  // Render: keep everything as-is but replace the resource UIs with per-lesson UIs
  // ------------------------------------------------------------
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
                        <h4>Enter Course Details</h4>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleSubmit}>
                          {/* Title */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Title
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>

                          {/* Author */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Author
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <input
                                type="text"
                                className="form-control"
                                name="Author"
                                value={formData.Author}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Author Link
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <input
                                type="text"
                                className="form-control"
                                name="AuthorLink"
                                value={formData.AuthorLink}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Short Description
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <textarea
                                type="text"
                                className="form-control"
                                name="shortdescription"
                                value={formData.shortdescription}
                                onChange={handleChange}
                                required
                              ></textarea>
                            </div>
                          </div>
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Price
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <input
                                type="Number"
                                className="form-control"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                              />
                            </div>
                          </div>


                          {/* Course Category */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Course Category
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <select
                                className="form-control selectric"
                                name="courseCategory"
                                value={formData.courseCategory}
                                onChange={handleChange}
                                required              // ← ensure they can’t submit without picking
                              >
                                <option value="" disabled>
                                  -- Select a Category --
                                </option>
                                {tools.length > 0
                                  ? tools.map((tool, i) => {
                                    const val = tool.category || tool;
                                    return (
                                      <option key={i} value={val}>
                                        {val}
                                      </option>
                                    );
                                  })
                                  : ["Tech", "News", "Political"].map((val) => (
                                    <option key={val} value={val}>
                                      {val}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Description
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <TextEditor onChange={(val) => setFormData(prev => ({ ...prev, description: val }))} />
                            </div>
                          </div>

                          {/* Course Content */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Course Content
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <TextEditor onChange={(val) => setFormData(prev => ({ ...prev, courseContent: val }))} />
                            </div>
                          </div>

                          {/* Thumbnail with Preview */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Thumbnail
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <div id="image-preview" className="image-preview">
                                <label htmlFor="image-upload" id="image-label">
                                  Choose File
                                </label>
                                <input
                                  type="file"
                                  name="thumbnail"
                                  id="image-upload"
                                  onChange={handleThumbnailChange}
                                  required
                                />
                                {thumbnailPreview && (
                                  <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail Preview"
                                    style={{ width: "200px", marginTop: "10px" }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* -------------------------
                              LESSON-BASED RESOURCE RENDERING
                              ------------------------- */}
                          <div className="mb-4">
                            <h5>Lessons & Resources</h5>
                            <p className="text-muted">Add lessons using the button below. Each lesson contains files (max 5) and multiple link entries per resource type.</p>

                            {files.map((lessonObj, lessonIndex) => {
                              const lessonNumber = (lessonObj.lesson && lessonObj.lesson[0]) || lessonIndex + 1;
                              return (
                                <div key={lessonIndex} className="card mb-3">
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <strong>Lesson {lessonNumber}</strong>
                                    </div>

                                    {/* Files per lesson */}
                                    <div className="mb-3">
                                      <label className="form-label">Files (max 5 for this lesson)</label>
                                      {(lessonObj.content || []).map((f, fi) => (
                                        <div key={fi} className="d-flex align-items-center mb-2">
                                          <input
                                            type="file"
                                            onChange={(e) => handleLessonFileChange(lessonIndex, fi, e)}
                                          />
                                          {(lessonObj.content || []).length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm ms-2"
                                              onClick={() => removeFileFromLesson(lessonIndex, fi)}
                                            >
                                              Remove
                                            </button>
                                          )}
                                          {/* show filename if present */}
                                          {f instanceof File && (
                                            <span style={{ marginLeft: 8 }}>{f.name}</span>
                                          )}
                                        </div>
                                      ))}
                                      <div>
                                        <button
                                          type="button"
                                          className="btn btn-secondary btn-sm"
                                          onClick={() => addFileToLesson(lessonIndex)}
                                          disabled={((files[lessonIndex].content || []).length >= 5)}
                                        >
                                          Add File to Lesson {lessonNumber}
                                        </button>
                                        <small className="text-muted ms-2">
                                          {((files[lessonIndex].content || []).length)}/5 used
                                        </small>
                                      </div>
                                    </div>

                                    {/* Video Links per lesson */}
                                    <div className="mb-3">
                                      <label className="form-label">Video Links</label>
                                      {(videosLinks[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={link}
                                            onChange={(e) => handleVideoLinkChange(lessonIndex, li, e.target.value)}
                                            placeholder="Enter Video link"
                                          />
                                          {(videosLinks[lessonIndex].content || []).length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm ms-2"
                                              onClick={() => removeVideoLink(lessonIndex, li)}
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addVideoLink(lessonIndex)}>
                                        Add Video Link
                                      </button>
                                    </div>

                                    {/* External Links per lesson */}
                                    <div className="mb-3">
                                      <label className="form-label">External Links</label>
                                      {(externalLinks[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={link}
                                            onChange={(e) => handleExternalLinkChange(lessonIndex, li, e.target.value)}
                                            placeholder="Enter external link"
                                          />
                                          {(externalLinks[lessonIndex].content || []).length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm ms-2"
                                              onClick={() => removeExternalLink(lessonIndex, li)}
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addExternalLink(lessonIndex)}>
                                        Add External Link
                                      </button>
                                    </div>

                                    {/* Reference Links per lesson */}
                                    <div className="mb-3">
                                      <label className="form-label">Reference Links</label>
                                      {(referenceLinks[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={link}
                                            onChange={(e) => handleReferenceLinkChange(lessonIndex, li, e.target.value)}
                                            placeholder="Enter reference link"
                                          />
                                          {(referenceLinks[lessonIndex].content || []).length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm ms-2"
                                              onClick={() => removeReferenceLink(lessonIndex, li)}
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addReferenceLink(lessonIndex)}>
                                        Add Reference Link
                                      </button>
                                    </div>

                                    {/* Assessment Links per lesson */}
                                    <div className="mb-3">
                                      <label className="form-label">Assessment Links</label>
                                      {(assessmentLinks[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={link}
                                            onChange={(e) => handleAssessmentLinkChange(lessonIndex, li, e.target.value)}
                                            placeholder="Enter assessment link"
                                          />
                                          {(assessmentLinks[lessonIndex].content || []).length > 1 && (
                                            <button
                                              type="button"
                                              className="btn btn-danger btn-sm ms-2"
                                              onClick={() => removeAssessmentLink(lessonIndex, li)}
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addAssessmentLink(lessonIndex)}>
                                        Add Assessment Link
                                      </button>
                                    </div>

                                  </div>
                                </div>
                              );
                            })}

                            {/* Add Lesson Button (placed before submit) */}
                            <div className="mb-3">
                              <button type="button" className="btn btn-primary" onClick={addLesson}>
                                Add Lesson
                              </button>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="form-group row mb-4">
                            <div className="col-sm-12 col-md-7 offset-md-3">
                              <button type="submit" className="btn btn-primary">
                                Create Course
                              </button>
                            </div>
                          </div>
                        </form>
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

export default CreateCourse;
