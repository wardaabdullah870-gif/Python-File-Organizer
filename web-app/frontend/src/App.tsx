
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

type FileCategory = "Images" | "Audio" | "Documents" | "Videos" | "Others";

type OrganizerFile = {
  id: string;
  name: string;
  size: number;
  category: FileCategory;
  date: string;
};

const categories: {
  name: FileCategory;
  symbol: string;
  description: string;
  color: string;
}[] = [
  { name: "Images", symbol: "▧", description: "Photos and pictures", color: "pink" },
  { name: "Audio", symbol: "♫", description: "Music and sound", color: "peach" },
  { name: "Documents", symbol: "▤", description: "PDFs and documents", color: "blue" },
  { name: "Videos", symbol: "▶", description: "Movies and clips", color: "yellow" },
  { name: "Others", symbol: "▣", description: "Other file types", color: "blue" },
];

const folders = [
  "Personal Projects",
  "UI/UX Resources",
  "Workspace",
  "Reports",
  "Requirements Documents",
  "Nova - All Files",
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function App() {
  const [files, setFiles] = useState<OrganizerFile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  // Load files from Python backend
  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/files`);

      if (!response.ok) {
        throw new Error("Could not load files");
      }

      const data = await response.json();

      setFiles(
        data.map((file: any) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          category: file.category,
          date: "Uploaded",
        }))
      );
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Search and category filtering
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        file.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [files, search, selectedCategory]);

  
  // Calculate storage
const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

const storagePercent = Math.min(
  (totalBytes / (5 * 1024 * 1024 * 1024)) * 100,
  100
);
  // Upload files to backend
  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(event.target.files || []);

    if (selected.length === 0) return;

    const formData = new FormData();

    selected.forEach((file) => {
      formData.append("files", file);
    });

    setUploading(true);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      alert(result.message);

      setSelectedCategory("All");
      await loadFiles();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Could not upload files. Please check your backend.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  // Delete file from backend
  async function removeFile(id: string, category: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this file permanently?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/files/${encodeURIComponent(category)}/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await loadFiles();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete file.");
    }
  }

  // Download file from backend
  function downloadFile(file: OrganizerFile) {
    const url =
      `${API_URL}/download/${encodeURIComponent(file.category)}/${encodeURIComponent(file.id)}`;

    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function openCategory(category: string) {
    setSelectedCategory(category);
    setActiveNav("Categories");
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-mark">F</div>

        <nav className="side-nav">
          {[
            ["Dashboard", "⌂"],
            ["Categories", "▦"],
            ["Files", "▤"],
            ["Folders", "▱"],
            ["Shared", "↗"],
          ].map(([name, symbol]) => (
            <button
              key={name}
              className={`nav-button ${activeNav === name ? "active" : ""}`}
              title={name}
              onClick={() => {
                setActiveNav(name);
                if (name === "Dashboard" || name === "Files") {
                  setSelectedCategory("All");
                }
              }}
            >
              <span>{symbol}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-button" title="Help">?</button>
          <button className="nav-button" title="Settings">⚙</button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="main-area">

        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <div className="mobile-brand">F</div>
            <h1>{activeNav}</h1>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search files..."
              />
            </div>

            <button className="notification-button" title="Notifications">
              ♧
            </button>

            <div className="avatar">F</div>
          </div>
        </header>

        <div className="dashboard-layout">

          {/* LEFT CONTENT */}
          <section className="dashboard-content">

            {/* CATEGORIES */}
            <div className="section-heading">
              <h2>Categories</h2>
              <button
                className="text-link"
                onClick={() => setSelectedCategory("All")}
              >
                View All
              </button>
            </div>

            <div className="category-grid">
              {categories.map((category) => {
                const count = files.filter(
                  (file) => file.category === category.name
                ).length;

                return (
                  <button
                    key={category.name}
                    className={`category-card ${category.color} ${
                      selectedCategory === category.name ? "selected" : ""
                    }`}
                    onClick={() => openCategory(category.name)}
                  >
                    <div className="category-art">
                      {category.symbol}
                    </div>

                    <div className="category-info">
                      <strong>{category.name}</strong>
                      <span>{count} files</span>
                    </div>

                    <span className="category-arrow">›</span>
                  </button>
                );
              })}
            </div>

            {/* FOLDERS */}
            <div className="section-heading folder-heading">
              <h2>Folders</h2>
              <button
                className="text-link"
                onClick={() => setActiveNav("Folders")}
              >
                View All
              </button>
            </div>

            <div className="folder-grid">
              {folders.map((folder) => (
                <button
                  className="folder-card"
                  key={folder}
                  onClick={() => setSearch(folder)}
                >
                  <span className="folder-icon">▰</span>

                  <span className="folder-name">
                    <strong>{folder}</strong>
                    <small>{files.length} files</small>
                  </span>

                  <span className="folder-menu">⋮</span>
                </button>
              ))}
            </div>

            {/* RECENT UPLOADS */}
            <div className="section-heading uploads-heading">
              <div>
                <h2>Recent Uploads</h2>
                <p className="section-subtitle">
                  {selectedCategory === "All"
                    ? "Your recently added files"
                    : `Showing ${selectedCategory}`}
                </p>
              </div>

              <button
                className="upload-button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "+ Upload Files"}
              </button>

              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                onChange={handleUpload}
              />
            </div>

            {/* FILE TABLE */}
            <div className="file-table">

              <div className="file-table-header">
                <span>File name</span>
                <span>File size</span>
                <span>Actions</span>
              </div>

              {loading ? (
                <div className="empty-state">
                  Loading files...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="empty-state">
                  No files found. Upload a file to get started.
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div className="file-row" key={file.id}>

                    <div className="file-name-cell">
                      <span
                        className={`file-type ${file.category.toLowerCase()}`}
                      >
                        {file.category === "Images"
                          ? "▧"
                          : file.category === "Videos"
                          ? "▶"
                          : file.category === "Audio"
                          ? "♫"
                          : "▤"}
                      </span>

                      <span className="file-name-text">
                        <strong>{file.name}</strong>
                        <small>{file.date}</small>
                      </span>
                    </div>

                    <span className="file-size">
                      {formatSize(file.size)}
                    </span>

                    <div className="file-actions">
                      <button
                        className="delete-button"
                        title="Download file"
                        onClick={() => downloadFile(file)}
                      >
                        ↓
                      </button>

                      <button
                        className="delete-button"
                        title="Delete file"
                        onClick={() => removeFile(file.id, file.category)}
                      >
                        ×
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* UPLOAD HINT */}
            <div
              className="upload-hint"
              onClick={() => fileInput.current?.click()}
            >
              <span>＋</span>

              <div>
                <strong>Need to organize more files?</strong>
                <small>
                  Choose files from your computer to add them to your dashboard.
                </small>
              </div>

              <span className="hint-arrow">→</span>
            </div>

          </section>

          {/* STORAGE PANEL */}
          <aside className="storage-panel">

            <h2>Storage Overview</h2>

            <div className="storage-gauge">
              <div className="gauge-arc">
                <div className="gauge-inner" />
              </div>

              <div className="gauge-label">
                <strong>{formatSize(totalBytes)}</strong>
                <small>Uploaded on this device</small>
              </div>
            </div>

            <div className="storage-heading">
              <h3>Storage Details</h3>
              <span>Overview</span>
            </div>

            {categories.map((category) => {
              const categoryFiles = files.filter(
                (file) => file.category === category.name
              );

              const size = categoryFiles.reduce(
                (sum, file) => sum + file.size,
                0
              );

              const percent = totalBytes
             ?  (size / totalBytes) * 100
             : 0;

              return (
                <div className="storage-item" key={category.name}>

                  <div className={`storage-icon ${category.color}`}>
                    {category.symbol}
                  </div>

                  <div className="storage-item-content">

                    <div className="storage-item-top">
                      <strong>{category.name}</strong>
                      <span>{formatSize(size)}</span>
                    </div>

                    <small>
                      {categoryFiles.length} files
                    </small>

                    <div className="progress-track">
                      <div
                        className={`progress-fill ${category.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                  </div>
                </div>
              );
            })}

            <div className="storage-footer">
              <div className="upgrade-symbol">↑</div>

              <h3>Your files, organized.</h3>

              <p>
                Upload your files and keep everything in one place.
              </p>

              <button
                onClick={() => fileInput.current?.click()}
              >
                Upload Files
              </button>
            </div>

            <p className="storage-note">
              {storagePercent.toFixed(2)}% of illustrative 5 GB storage used
            </p>

          </aside>

        </div>
      </main>
    </div>
  );
}

export default App;
