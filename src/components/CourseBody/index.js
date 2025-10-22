"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../AdminSideBar";
import "@/styles/course-body.css";
import { fetchAllCoursesbyId, fetchMe } from "@/app/api";

const AdminBody = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      try {
        const data = await fetchAllCoursesbyId(id);
        setCourse(data);

        const userData = await fetchMe();
        if (!userData || !userData.courses || !userData.courses.includes(id)) {
          router.push("/profile");
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, router]);

  const BASE_ENDPOINT = process.env.NEXT_PUBLIC_BASE_ENDPOINT;

  const handleDownload = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName || fileUrl.split("/").pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const normalizeLessonField = (raw) => {
    if (raw === undefined || raw === null) return [];
    if (Array.isArray(raw)) {
      if (raw.length === 0) return [];
      const first = raw[0];
      if (first && typeof first === "object" && (first.lesson !== undefined || first.content !== undefined)) {
        return raw.map(entry => ({
          lesson: Array.isArray(entry.lesson) ? entry.lesson.map(Number) : (entry.lesson !== undefined ? [Number(entry.lesson)] : [1]),
          content: Array.isArray(entry.content) ? entry.content.slice() : (entry.content ? [entry.content] : []),
        }));
      }
      return [{ lesson: [1], content: raw.slice() }];
    }

    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return normalizeLessonField(parsed);
      } catch {
        return [{ lesson: [1], content: [raw] }];
      }
    }

    return [];
  };

  const lessonsData = useMemo(() => {
    if (!course) return [];

    const parsedFiles = normalizeLessonField(course.files);
    const parsedVideos = normalizeLessonField(course.videosLinks);
    const parsedExternal = normalizeLessonField(course.externalLinks);
    const parsedReference = normalizeLessonField(course.referenceLinks);
    const parsedAssessment = normalizeLessonField(course.assessmentLinks);

    const lessonSet = new Set();
    [parsedFiles, parsedVideos, parsedExternal, parsedReference, parsedAssessment].forEach(arr => {
      arr.forEach(entry => {
        const ln = Array.isArray(entry.lesson) ? Number(entry.lesson[0]) : Number(entry.lesson || 1);
        lessonSet.add(ln);
      });
    });

    if (lessonSet.size === 0) lessonSet.add(1);

    const lessonNumbers = Array.from(lessonSet).sort((a, b) => a - b);

    const lessons = lessonNumbers.map((ln) => {
      const key = (n) => n === undefined ? [] : (Array.isArray(n) ? n : [n]);

      const filesEntry = parsedFiles.find(e => Number(e.lesson[0]) === ln);
      const vidsEntry = parsedVideos.find(e => Number(e.lesson[0]) === ln);
      const externalEntry = parsedExternal.find(e => Number(e.lesson[0]) === ln);
      const referenceEntry = parsedReference.find(e => Number(e.lesson[0]) === ln);
      const assessmentEntry = parsedAssessment.find(e => Number(e.lesson[0]) === ln);

      const safeArray = (arr) => (Array.isArray(arr) ? arr.map(x => (typeof x === "string" ? x : (x && x.url) ? x.url : String(x || ""))).filter(Boolean) : []);

      return {
        lesson: ln,
        files: safeArray(filesEntry?.content || []),
        videos: safeArray(vidsEntry?.content || []),
        external: safeArray(externalEntry?.content || []),
        reference: safeArray(referenceEntry?.content || []),
        assessment: safeArray(assessmentEntry?.content || []),
      };
    });

    return lessons;
  }, [course]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!course) return <div className="p-4">Course not found</div>;

  return (
    <>
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row mb-3">
              <div className="col-lg-4 col-md-5">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="img-fluid mb-3 course-thumbnail"
                    />
                    <h3 className="mb-1">{course.title}</h3>
                    <div className="text-muted mb-2">{course.Author}</div>
                    <div className="course-category">
                      <strong>Category:</strong> {course.courseCategory || "N/A"}
                    </div>
                    <div className="course-info">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td><strong>Lessons</strong></td>
                            <td>{lessonsData.length}</td>
                          </tr>
                          <tr>
                            <td><strong>Total Files</strong></td>
                            <td>{lessonsData.reduce((s, l) => s + (l.files?.length || 0), 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8 col-md-7">
                <div className="card h-100">
                  <div className="card-body">
                    <p className="card-title mb-2">Description</p>
                    <div className="m-2" dangerouslySetInnerHTML={{ __html: course.description || "<em>No description</em>" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <p className="card-title mb-2">Course Content</p>
                    {course.courseContent ? (
                      <div className="m-2" dangerouslySetInnerHTML={{ __html: course.courseContent }} />
                    ) : (
                      <p className="m-2">No content available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Lessons</h5>
                    <div id="lessons-accordion">
                      {lessonsData.map((lesson) => (
                        <div className="mb-2" key={lesson.lesson}>
                          <details className="lesson-detail">
                            <summary className="lesson-summary">
                              <div>
                                <strong>Lesson {lesson.lesson}</strong>
                                <span className="lesson-info">
                                  {lesson.files.length ? `${lesson.files.length} file${lesson.files.length > 1 ? "s" : ""}` : "No files"}
                                  {(lesson.videos.length + lesson.external.length + lesson.reference.length + lesson.assessment.length) > 0 &&
                                    ` • ${lesson.videos.length} videos • ${lesson.external.length} external • ${lesson.reference.length} refs • ${lesson.assessment.length} assessments`
                                  }
                                </span>
                              </div>
                              <div className="lesson-toggle">Click to expand</div>
                            </summary>

                            <div className="lesson-content">
                              <div className="lesson-left-column">
                                <div className="lesson-files">
                                  <h6>Files</h6>
                                  {lesson.files && lesson.files.length > 0 ? (
                                    <ul>
                                      {lesson.files.map((fUrl, idx) => {
                                        const name = fUrl.split("/").pop() || `File-${idx + 1}`;
                                        return (
                                          <li key={fUrl + idx}>
                                            <div className="file-info">
                                              <strong>{name}</strong>
                                              <div className="file-actions">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleDownload(fUrl, name)}>
                                                  Download
                                                </button>
                                                <a className="btn btn-sm btn-outline-secondary" href={fUrl} target="_blank" rel="noreferrer">Open</a>
                                              </div>
                                            </div>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  ) : (
                                    <div className="text-muted">No files for this lesson</div>
                                  )}
                                </div>
                                <div className="lesson-videos">
                                  <h6>Videos</h6>
                                  {lesson.videos && lesson.videos.length > 0 ? (
                                    lesson.videos.map((video, index) => (
                                      <div key={index} className="video-container">
                                        <iframe
                                          src={video.replace(/^["']|["']$/g, "")}
                                          className="video-frame"
                                          allowFullScreen
                                        />
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-muted">No videos for this lesson</div>
                                  )}
                                </div>

                                <div className="lesson-assessments">
                                  <h6>Assessments</h6>
                                  {lesson.assessment && lesson.assessment.length > 0 ? (
                                    <ul>
                                      {lesson.assessment.map((a, i) => (
                                        <li key={i}>
                                          <a href={a} target="_blank" rel="noreferrer">{a}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-muted">No assessments for this lesson</div>
                                  )}
                                </div>
                              </div>

                              <div className="lesson-right-column">
                                <div className="lesson-external">
                                  <h6>External Links</h6>
                                  {lesson.external && lesson.external.length > 0 ? (
                                    <ul>
                                      {lesson.external.map((ex, idx) => (
                                        <li key={idx}>
                                          <a href={ex} target="_blank" rel="noreferrer">{ex}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-muted">No external links</div>
                                  )}
                                </div>

                                <div className="lesson-reference">
                                  <h6>Reference Links</h6>
                                  {lesson.reference && lesson.reference.length > 0 ? (
                                    <ul>
                                      {lesson.reference.map((r, idx) => (
                                        <li key={idx}>
                                          <a href={r} target="_blank" rel="noreferrer">{r}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-muted">No reference links</div>
                                  )}
                                </div>

                                <div className="lesson-metadata">
                                  <div>Lesson #{lesson.lesson}</div>
                                  <div>{(lesson.files?.length || 0)} files</div>
                                  <div>{(lesson.videos?.length || 0)} videos</div>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-spacing"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminBody;
