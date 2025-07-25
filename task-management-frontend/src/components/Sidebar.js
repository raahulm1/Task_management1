import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import keycloak from '../keycloak';
import TaskForm from "./TaskForm";
import { createProject } from "../api/projects";
import { createTeam } from "../api/teams";
import { getUsers } from "../api/users";
import { getTeams } from "../api/teams";
import { useKeycloak } from '@react-keycloak/web';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Sidebar({ collapsed, setCollapsed, projects = [], loading, error, showProjects = true, sections = [] }) {
  const navigate = useNavigate();
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const { keycloak } = useKeycloak();

  useEffect(() => {
    if ((openModal === 'project' || openModal === 'team' || openModal === 'task') && keycloak?.token) {
      getUsers(keycloak.token).then(setUsers).catch(() => setUsers([]));
    }
    if (openModal === 'project' && keycloak?.token) {
      getTeams(keycloak.token).then(setTeams).catch(() => setTeams([]));
    }
  }, [openModal, keycloak]);

  const renderModal = () => {
    if (!openModal) return null;
    let title = '';
    let body = null;
    switch (openModal) {
      case 'project':
        title = 'Create Project';
        body = <ProjectForm onClose={() => setOpenModal(null)} />;
        break;
      case 'task':
        title = 'Create Task';
        body = <TaskForm users={users} sections={sections} onAdd={() => setOpenModal(null)} onClose={() => setOpenModal(null)} currentUser={keycloak?.tokenParsed ? { id: keycloak.tokenParsed.sub, name: keycloak.tokenParsed.name, email: keycloak.tokenParsed.email } : null} />;
        break;
      case 'team':
        title = 'Create Team';
        body = <TeamForm onClose={() => setOpenModal(null)} />;
        break;
      default:
        return null;
    }
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog">
          <div className="modal-content bg-dark text-white">
            <div className="modal-header border-secondary">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setOpenModal(null)}></button>
            </div>
            <div className="modal-body">{body}</div>
          </div>
        </div>
      </div>
    );
  };

  const ProjectForm = ({ onClose }) => {
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [team, setTeam] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      if (!name || !team) {
        setError("Project name and team are required.");
        return;
      }
      setLoading(true);
      try {
        await createProject({ name, teamId: team, userIds: selectedUsers }, keycloak.token);
        toast.success("Project created!");
        setOpenModal(null);
        window.location.reload();
      } catch (err) {
        setError("Failed to create project");
        toast.error("Failed to create project");
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Project Name</label>
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Team</label>
          <select className="form-select" value={team} onChange={e => setTeam(e.target.value)} required>
            <option value="">Select team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {/*<div className="mb-3">
          <label className="form-label">Users</label>
          <select className="form-select" multiple value={selectedUsers} onChange={e => setSelectedUsers(Array.from(e.target.selectedOptions, o => o.value))}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>*/}
        {error && <div className="alert alert-danger py-1">{error}</div>}
        <div className="text-end">
          <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !name || !team}>{loading ? "Creating..." : "Create"}</button>
        </div>
      </form>
    );
  };

  const TeamForm = ({ onClose }) => {
    const [name, setName] = useState("");
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      if (!name) {
        setError("Team name is required.");
        return;
      }
      setLoading(true);
      try {
        await createTeam({ name, members }, keycloak.token);
        toast.success("Team created!");
        setOpenModal(null);
        window.location.reload();
      } catch (err) {
        setError("Failed to create team");
        toast.error("Failed to create team");
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Team Name</label>
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Members</label>
          <select className="form-select" multiple value={members} onChange={e => setMembers(Array.from(e.target.selectedOptions, o => o.value))}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        {error && <div className="alert alert-danger py-1">{error}</div>}
        <div className="text-end">
          <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !name}>{loading ? "Creating..." : "Create"}</button>
        </div>
      </form>
    );
  };

  return (
    <div
      className="d-flex flex-column text-white"
      style={{
        backgroundColor: "#1f1f1f",
        width: collapsed ? "70px" : "220px",
        transition: "width 0.3s ease",
        padding: "1rem 0.5rem",
        overflowY: "auto",
      }}
    >
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      {/* Toggle & Logo */}
      <div className="d-flex align-items-center mb-4 px-2">
        <button
          className="btn btn-sm btn-outline-light me-2"
          onClick={() => setCollapsed(!collapsed)}
        >
          <i className={`bi ${collapsed ? "bi-arrow-right" : "bi-arrow-left"}`}></i>
        </button>
        {/*{!collapsed && (
          <span className="fw-bold" style={{ fontSize: "1.1rem" }}>
            CMart
          </span>
        )}*/}
      </div>

      {/* Create Button */}
      <div className="mb-2 position-relative">
        <button
          className={`btn btn-success w-100 ${collapsed ? "mx-auto" : ""}`}
          onClick={() => setShowCreateDropdown((prev) => !prev)}
        >
          <i className="bi bi-plus-lg me-2"></i>
          {!collapsed && "Create"}
        </button>
        {showCreateDropdown && !collapsed && (
          <div
            className="position-absolute w-100 mt-1"
            style={{ backgroundColor: "#222", border: "1px solid #555", zIndex: 1000 }}
          >
            <div
              className="p-2 text-white d-flex align-items-center"
              style={{ cursor: "pointer" }}
              onClick={() => { setOpenModal('project'); setShowCreateDropdown(false); }}
            >
              <i className="bi bi-kanban me-2"></i> Create Project
            </div>
            {/*<div
              className="p-2 text-white d-flex align-items-center"
              style={{ cursor: "pointer" }}
              onClick={() => { setOpenModal('task'); setShowCreateDropdown(false); }}
            >
              <i className="bi bi-card-checklist me-2"></i> Create Task
            </div>*/}
            <div
              className="p-2 text-white d-flex align-items-center"
              style={{ cursor: "pointer" }}
              onClick={() => { setOpenModal('team'); setShowCreateDropdown(false); }}
            >
              <i className="bi bi-people me-2"></i> Create Team
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ul className="nav flex-column mb-3">
        <li className="nav-item">
          <button
            className="nav-link text-white d-flex align-items-center"
            onClick={() => navigate("/dashboard")}
            style={{ padding: "0.5rem", borderRadius: "5px" }}
          >
            <i className="bi bi-house me-2"></i>
            {!collapsed && "Home"}
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link text-white d-flex align-items-center"
            onClick={() => navigate("/my-tasks")}
            style={{ padding: "0.5rem", borderRadius: "5px" }}
          >
            <i className="bi bi-list-check me-2"></i>
            {!collapsed && "My Tasks"}
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link text-white d-flex align-items-center"
            onClick={() => navigate("/my-projects")}
            style={{ padding: "0.5rem", borderRadius: "5px" }}
          >
            <i className="bi bi-kanban me-2"></i>
            {!collapsed && "My Projects"}
          </button>
        </li>
      </ul>

      {/* Projects */}
      {!collapsed && showProjects && (
        <ul className="list-unstyled mb-3 ps-3">
          {loading ? (
            <li className="text-white-50">Loading...</li>
          ) : error ? (
            <li className="text-danger">{error}</li>
          ) : projects.length === 0 ? (
            <li className="text-white-50">No projects found.</li>
          ) : (
            projects.map((proj) => (
              <li
                key={proj.id}
                className="mb-1 text-white d-flex align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/project/${proj.id}`)}
              >
                <i className="bi bi-folder2-open me-2 text-secondary"></i>
                {proj.name}
              </li>
            ))
          )}
        </ul>
      )}

      
      {renderModal()}
    </div>
  );
}

export default Sidebar;
