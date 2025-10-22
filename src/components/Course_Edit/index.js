"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "../Admin_Sidebar";
import Navbar from "../Admin_Nav";
import Resources from "../Admin_Scripts";
import axios from "axios";
import { TextEditor } from "./TextEditor";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import {
  fetchMe, fetchCoursesArray
} from "@/app/api";

const EditCourse = () => {
  const router = useRouter();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [loading3, setLoading3] = useState(true);
  const [loading2, setLoading2] = useState(true);

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
      if (me && (me.level !== "super" && me.level !== "community")) {
        router.push("/admin/opulententrepreneurs/open/dashboard");
      } else {
        setLoading2(false);
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

  // Thumbnail
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState(null);

  // filesToRemove: URLs removed by the user
  const [filesToRemove, setFilesToRemove] = useState([]);

  // ---------- Lesson-based states ----------
  // filesLessons: { lesson: [n], existingContent: [url strings], newFiles: [File|null] }
  const [filesLessons, setFilesLessons] = useState([
    { lesson: [1], existingContent: [], newFiles: [null] },
  ]);

  // other lessons: { lesson: [n], content: [string links] }
  const [videosLessons, setVideosLessons] = useState([{ lesson: [1], content: [""] }]);
  const [externalLessons, setExternalLessons] = useState([{ lesson: [1], content: [""] }]);
  const [referenceLessons, setReferenceLessons] = useState([{ lesson: [1], content: [""] }]);
  const [assessmentLessons, setAssessmentLessons] = useState([{ lesson: [1], content: [""] }]);

  // helper: parse field that can be either legacy flat or new lesson-shaped
  const parseLessonField = (field) => {
    if (!field) return [];
    if (Array.isArray(field) && field.length > 0) {
      // If first element looks like { lesson: [...], content: [...] }, assume lesson-shaped
      const first = field[0];
      if (first && (first.lesson !== undefined || first.content !== undefined)) {
        // Ensure shape
        return field.map((f) => ({
          lesson: Array.isArray(f.lesson) ? f.lesson : (f.lesson !== undefined ? [f.lesson] : [1]),
          content: Array.isArray(f.content) ? f.content : (f.content ? [f.content] : []),
        }));
      }
      // Else assume array of strings (legacy) -> put under lesson 1
      return [{ lesson: [1], content: field.slice() }];
    }
    // If it's a JSON string
    try {
      const parsed = JSON.parse(field);
      return parseLessonField(parsed);
    } catch {
      return [];
    }
  };

  // helper: get lesson number from entry
  const lessonNumberFromEntry = (entry) => {
    if (!entry) return 1;
    const ln = Array.isArray(entry.lesson) ? entry.lesson[0] : entry.lesson;
    return Number(ln || 1);
  };

  // On mount: fetch course and build lesson-scoped states
  useEffect(() => {
    if (!id) return;

    axios.get(`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/course/${id}`)
      .then(({ data: course }) => {
        // Parse fields which might be JSON strings or arrays already in new shape
        const parsedVideos = parseLessonField(course.videosLinks);
        const parsedExternal = parseLessonField(course.externalLinks);
        const parsedReference = parseLessonField(course.referenceLinks);
        const parsedAssessment = parseLessonField(course.assessmentLinks);
        const parsedFiles = parseLessonField(course.files); // files stored as { lesson: [n], content: [url] }

        // Collect lesson numbers union
        const lessonSet = new Set();
        [parsedVideos, parsedExternal, parsedReference, parsedAssessment, parsedFiles].forEach((arr) => {
          arr.forEach((entry) => {
            const ln = lessonNumberFromEntry(entry);
            lessonSet.add(ln);
          });
        });

        // If no lessons found, default to lesson 1
        if (lessonSet.size === 0) lessonSet.add(1);

        const lessonNumbers = Array.from(lessonSet).sort((a, b) => a - b);

        // Build filesLessons: for each lesson number, find parsedFiles entry if present
        const builtFilesLessons = lessonNumbers.map((ln) => {
          const match = parsedFiles.find(e => lessonNumberFromEntry(e) === ln);
          return {
            lesson: [ln],
            existingContent: match ? (match.content || []).slice() : [],
            newFiles: [null], // one empty new file slot by default
          };
        });

        const builtVideos = lessonNumbers.map((ln) => {
          const match = parsedVideos.find(e => lessonNumberFromEntry(e) === ln);
          return { lesson: [ln], content: match ? (match.content || []).slice() : [""] };
        });

        const builtExternal = lessonNumbers.map((ln) => {
          const match = parsedExternal.find(e => lessonNumberFromEntry(e) === ln);
          return { lesson: [ln], content: match ? (match.content || []).slice() : [""] };
        });

        const builtReference = lessonNumbers.map((ln) => {
          const match = parsedReference.find(e => lessonNumberFromEntry(e) === ln);
          return { lesson: [ln], content: match ? (match.content || []).slice() : [""] };
        });

        const builtAssessment = lessonNumbers.map((ln) => {
          const match = parsedAssessment.find(e => lessonNumberFromEntry(e) === ln);
          return { lesson: [ln], content: match ? (match.content || []).slice() : [""] };
        });

        setFilesLessons(builtFilesLessons);
        setVideoLessons(builtVideos); // note: setVideoLessons is defined below; temporary naming fix done later
        setVideosLessons(builtVideos); // ensure both names safe
        setExternalLessons(builtExternal);
        setReferenceLessons(builtReference);
        setAssessmentLessons(builtAssessment);

        // Set form fields
        setFormData({
          title: course.title || "",
          Author: course.Author || "",
          AuthorLink: course.AuthorLink || "",
          courseCategory: course.courseCategory || "Tech",
          description: course.description || "",
          shortdescription: course.shortdescription || "",
          courseContent: course.courseContent || "",
          price: course.price || "",
        });

        if (course.thumbnail) {
          setExistingThumbnail(course.thumbnail);
          setThumbnailPreview(course.thumbnail);
        }
      })
      .catch(err => console.error(err));
  }, [id]);

  // The original code used setVideoLinks variable; to avoid renaming issues, create setVideoLessons alias
  // (we already defined videosLessons and setVideosLessons via useState).
  // (No additional action required.)

  // ---------- Handlers ----------
  const setVideoLessons = (val) => {
    // placeholder – actually setVideosLessons is the state setter from useState above.
    // But we also created setVideosLessons by useState; so this line is unnecessary.
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    setThumbnail(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  };

  // ---------- Files per lesson ----------
  const handleLessonFileChange = (lessonIndex, fileIndex, e) => {
    const file = e.target.files[0] ?? null;
    setFilesLessons((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].newFiles = copy[lessonIndex].newFiles || [];
      copy[lessonIndex].newFiles[fileIndex] = file;
      return copy;
    });
  };

  const addNewFileSlotToLesson = (lessonIndex) => {
    setFilesLessons((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const existingCount = (copy[lessonIndex].existingContent || []).length;
      const newCount = (copy[lessonIndex].newFiles || []).length;
      if (existingCount + newCount >= 5) return prev; // enforce 5 per lesson
      copy[lessonIndex].newFiles = copy[lessonIndex].newFiles || [];
      copy[lessonIndex].newFiles.push(null);
      return copy;
    });
  };

  const removeNewFileFromLesson = (lessonIndex, newFileIndex) => {
    setFilesLessons((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].newFiles = (copy[lessonIndex].newFiles || []).filter((_, i) => i !== newFileIndex);
      return copy;
    });
  };

  const removeExistingFileFromLesson = (lessonIndex, fileUrl) => {
    // Add to filesToRemove and remove from existingContent
    setFilesLessons((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].existingContent = (copy[lessonIndex].existingContent || []).filter(f => f !== fileUrl);
      return copy;
    });
    setFilesToRemove((prev) => [...prev, fileUrl]);
  };

  // ---------- Links per lesson (generic handlers) ----------
  const handleLessonStringChange = (setter, stateArr, lessonIndex, contentIndex, value) => {
    setter((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = copy[lessonIndex].content || [];
      copy[lessonIndex].content[contentIndex] = value;
      return copy;
    });
  };

  const addStringSlotToLesson = (setter, stateArr, lessonIndex) => {
    setter((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = copy[lessonIndex].content || [];
      copy[lessonIndex].content.push("");
      return copy;
    });
  };

  const removeStringSlotFromLesson = (setter, stateArr, lessonIndex, contentIndex) => {
    setter((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[lessonIndex].content = (copy[lessonIndex].content || []).filter((_, i) => i !== contentIndex);
      return copy;
    });
  };

  const handleVideoLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setVideosLessons, videosLessons, lessonIndex, contentIndex, value);
  const addVideoLink = (lessonIndex) => addStringSlotToLesson(setVideosLessons, videosLessons, lessonIndex);
  const removeVideoLink = (lessonIndex, contentIndex) =>
    removeStringSlotFromLesson(setVideosLessons, videosLessons, lessonIndex, contentIndex);

  const handleExternalLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setExternalLessons, externalLessons, lessonIndex, contentIndex, value);
  const addExternalLink = (lessonIndex) => addStringSlotToLesson(setExternalLessons, externalLessons, lessonIndex);
  const removeExternalLink = (lessonIndex, contentIndex) =>
    removeStringSlotFromLesson(setExternalLessons, externalLessons, lessonIndex, contentIndex);

  const handleReferenceLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setReferenceLessons, referenceLessons, lessonIndex, contentIndex, value);
  const addReferenceLink = (lessonIndex) => addStringSlotToLesson(setReferenceLessons, referenceLessons, lessonIndex);
  const removeReferenceLink = (lessonIndex, contentIndex) =>
    removeStringSlotFromLesson(setReferenceLessons, referenceLessons, lessonIndex, contentIndex);

  const handleAssessmentLinkChange = (lessonIndex, contentIndex, value) =>
    handleLessonStringChange(setAssessmentLessons, assessmentLessons, lessonIndex, contentIndex, value);
  const addAssessmentLink = (lessonIndex) => addStringSlotToLesson(setAssessmentLessons, assessmentLessons, lessonIndex);
  const removeAssessmentLink = (lessonIndex, contentIndex) =>
    removeStringSlotFromLesson(setAssessmentLessons, assessmentLessons, lessonIndex, contentIndex);

  // ---------- Add / Remove Lesson ----------
  const addLesson = () => {
    // compute next lesson number
    const allLessonsCount = Math.max(
      filesLessons.length,
      videosLessons.length,
      externalLessons.length,
      referenceLessons.length,
      assessmentLessons.length
    );
    const next = allLessonsCount + 1;

    setFilesLessons((prev) => [...prev, { lesson: [next], existingContent: [], newFiles: [null] }]);
    setVideosLessons((prev) => [...prev, { lesson: [next], content: [""] }]);
    setExternalLessons((prev) => [...prev, { lesson: [next], content: [""] }]);
    setReferenceLessons((prev) => [...prev, { lesson: [next], content: [""] }]);
    setAssessmentLessons((prev) => [...prev, { lesson: [next], content: [""] }]);
  };

  // ---------- Helpers ----------
  const injectTableBorders = (htmlString) => {
    if (!htmlString) return htmlString;
    const container = document.createElement("div");
    container.innerHTML = htmlString;
    container.querySelectorAll("table").forEach((table) => {
      const currentStyle = table.getAttribute("style") || "";
      const borderStyle = "border: 1px solid #000; border-collapse: collapse;";
      table.setAttribute("style", currentStyle + borderStyle);
      table.querySelectorAll("th, td").forEach((cell) => {
        const cellCurrentStyle = cell.getAttribute("style") || "";
        cell.setAttribute("style", cellCurrentStyle + "border: 1px solid #000;");
      });
    });
    return container.innerHTML;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedDescription = injectTableBorders(formData.description);
    const updatedCourseContent = injectTableBorders(formData.courseContent);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("Author", formData.Author);
    data.append("AuthorLink", formData.AuthorLink);
    data.append("price", formData.price);
    data.append("courseCategory", formData.courseCategory);
    data.append("shortdescription", formData.shortdescription);
    data.append("description", updatedDescription);
    data.append("courseContent", updatedCourseContent);

    if (thumbnail) data.append("thumbnail", thumbnail);

    // Build filesMeta and append actual new files under "files"
    const filesMeta = []; // [{ lesson: [n], filename: originalname }]
    filesLessons.forEach((lessonObj) => {
      const ln = lessonObj.lesson && lessonObj.lesson[0] ? lessonObj.lesson[0] : 1;
      (lessonObj.newFiles || []).forEach((file) => {
        if (file instanceof File) {
          data.append("files", file);
          filesMeta.push({ lesson: [ln], filename: file.name });
        }
      });
    });

    if (filesMeta.length) data.append("filesMeta", JSON.stringify(filesMeta));

    // Send filesToRemove array (URLs)
    filesToRemove.forEach(url => data.append("filesToRemove", url));

    // Append other lesson-based resources as JSON
    data.append("videosLinks", JSON.stringify(videosLessons));
    data.append("externalLinks", JSON.stringify(externalLessons));
    data.append("referenceLinks", JSON.stringify(referenceLessons));
    data.append("assessmentLinks", JSON.stringify(assessmentLessons));
    // Also include the current filesLessons shape (existing content names) so server knows placeholders
    data.append("filesLessonsShape", JSON.stringify(
      filesLessons.map(f => ({ lesson: f.lesson, existingContent: f.existingContent }))
    ));

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/course/edit/${id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Course updated successfully.");
      router.push("/admin/opulententrepreneurs/open/courses");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Error updating course.");
    }
  };

  // ---------- Tools fetch (unchanged) ----------
  const [tools, setTools] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchCoursesArray();
        setTools(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  if (loading2) {
    return <div className="p-4">Loading...</div>;
  }

  // Render
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
                        <h4>Edit Course</h4>
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

                          {/* Author Link */}
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

                          {/* Short Description */}
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

                          {/* Price */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Price
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <input
                                type="number"
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
                                required
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
                              <TextEditor
                                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                                initialValue={formData.description}
                              />
                            </div>
                          </div>

                          {/* Course Content */}
                          <div className="form-group row mb-4">
                            <label className="col-form-label text-md-right col-12 col-md-3 col-lg-3">
                              Course Content
                            </label>
                            <div className="col-sm-12 col-md-7">
                              <TextEditor
                                onChange={(val) => setFormData(prev => ({ ...prev, courseContent: val }))}
                                initialValue={formData.courseContent}
                              />
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
                                  {existingThumbnail ? "Change File" : "Choose File"}
                                </label>
                                <input
                                  type="file"
                                  name="thumbnail"
                                  id="image-upload"
                                  onChange={handleThumbnailChange}
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

                          {/* ---------- Lessons & Resources ---------- */}
                          <div className="mb-4">
                            <h5>Lessons & Resources</h5>
                            <p className="text-muted">Each lesson can have up to 5 files (existing + new). Add/remove links per lesson. Use the Add Lesson button to append a new lesson.</p>

                            {filesLessons.map((lessonObj, lessonIndex) => {
                              const lessonNum = lessonObj.lesson && lessonObj.lesson[0] ? lessonObj.lesson[0] : lessonIndex + 1;
                              const existingCount = (lessonObj.existingContent || []).length;
                              const newCount = (lessonObj.newFiles || []).length;
                              return (
                                <div key={lessonIndex} className="card mb-3">
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <strong>Lesson {lessonNum}</strong>
                                    </div>

                                    {/* Existing files */}
                                    <div className="mb-3">
                                      <label className="form-label">Existing Files</label>
                                      {(lessonObj.existingContent || []).map((url) => (
                                        <div key={url} className="d-flex align-items-center mb-2" style={{ justifyContent: "space-between" }}>
                                          <a href={url} target="_blank" rel="noopener noreferrer" download>{url.split("/").pop()}</a>
                                          <button type="button" className="btn btn-sm btn-danger" onClick={() => removeExistingFileFromLesson(lessonIndex, url)}>Remove</button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* New file slots */}
                                    <div className="mb-3">
                                      <label className="form-label">New Files (for this lesson) - {existingCount + newCount}/5 used</label>
                                      {(lessonObj.newFiles || []).map((slot, fi) => (
                                        <div key={fi} className="d-flex align-items-center mb-2">
                                          <input type="file" onChange={(e) => handleLessonFileChange(lessonIndex, fi, e)} />
                                          {(lessonObj.newFiles || []).length > 0 && (
                                            <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => removeNewFileFromLesson(lessonIndex, fi)}>Remove</button>
                                          )}
                                          {slot instanceof File && <span style={{ marginLeft: 8 }}>{slot.name}</span>}
                                        </div>
                                      ))}
                                      <div>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addNewFileSlotToLesson(lessonIndex)} disabled={existingCount + newCount >= 5}>
                                          Add File to Lesson {lessonNum}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Video Links */}
                                    <div className="mb-3">
                                      <label className="form-label">Video Links</label>
                                      {(videosLessons[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input type="text" className="form-control" value={link} onChange={(e) => handleVideoLinkChange(lessonIndex, li, e.target.value)} placeholder="Enter video link" />
                                          {(videosLessons[lessonIndex].content || []).length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => removeVideoLink(lessonIndex, li)}>Remove</button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addVideoLink(lessonIndex)}>Add Video Link</button>
                                    </div>

                                    {/* External Links */}
                                    <div className="mb-3">
                                      <label className="form-label">External Links</label>
                                      {(externalLessons[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input type="text" className="form-control" value={link} onChange={(e) => handleExternalLinkChange(lessonIndex, li, e.target.value)} placeholder="Enter external link" />
                                          {(externalLessons[lessonIndex].content || []).length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => removeExternalLink(lessonIndex, li)}>Remove</button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addExternalLink(lessonIndex)}>Add External Link</button>
                                    </div>

                                    {/* Reference Links */}
                                    <div className="mb-3">
                                      <label className="form-label">Reference Links</label>
                                      {(referenceLessons[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input type="text" className="form-control" value={link} onChange={(e) => handleReferenceLinkChange(lessonIndex, li, e.target.value)} placeholder="Enter reference link" />
                                          {(referenceLessons[lessonIndex].content || []).length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => removeReferenceLink(lessonIndex, li)}>Remove</button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addReferenceLink(lessonIndex)}>Add Reference Link</button>
                                    </div>

                                    {/* Assessment Links */}
                                    <div className="mb-3">
                                      <label className="form-label">Assessment Links</label>
                                      {(assessmentLessons[lessonIndex]?.content || []).map((link, li) => (
                                        <div key={li} className="d-flex align-items-center mb-2">
                                          <input type="text" className="form-control" value={link} onChange={(e) => handleAssessmentLinkChange(lessonIndex, li, e.target.value)} placeholder="Enter assessment link" />
                                          {(assessmentLessons[lessonIndex].content || []).length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => removeAssessmentLink(lessonIndex, li)}>Remove</button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => addAssessmentLink(lessonIndex)}>Add Assessment Link</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="mb-3">
                              <button type="button" className="btn btn-primary" onClick={addLesson}>Add Lesson</button>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="form-group row mb-4">
                            <div className="col-sm-12 col-md-7 offset-md-3">
                              <button type="submit" className="btn btn-primary">
                                Update Course
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

export default EditCourse;
