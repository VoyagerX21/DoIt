'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

const emptyForm = { title: '', description: '', status: 'todo' };
const PAGE_LIMIT = 10;

export default function DashboardClient() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [error, setError] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [sortedTasks, setSortedTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadTasks(page = 1) {
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (statusFilter) query.set('status', statusFilter);
    if (search) query.set('search', search);

    try {
      const data = await api(`/api/tasks?${query.toString()}`);
      setTasks(data.data);
      setSortedTasks(data.data);
      setMeta(data.meta);
      setCurrentPage(page);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadTasks(1);
  }, [statusFilter]);

  async function createTask(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/tasks', { method: 'POST', body: JSON.stringify(form) });
      setForm(emptyForm);
      loadTasks(currentPage);
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadTasks(currentPage);
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function deleteTask(id) {
    try {
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      // If deleting last item on a page > 1, go back one page
      const newPage = sortedTasks.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      loadTasks(newPage);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedTask) return;
    const newTasks = [...sortedTasks];
    const draggedIndex = newTasks.findIndex(t => t._id === draggedTask._id);
    if (draggedIndex !== -1) {
      newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, draggedTask);
      setSortedTasks(newTasks);
    }
    setDraggedTask(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return { bg: '#FEF3C7', border: '#FBBF24', text: '#92400E' };
      case 'in-progress': return { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' };
      case 'done': return { bg: '#DCFCE7', border: '#22C55E', text: '#166534' };
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaginationPages = () => {
    const pages = [];
    const total = meta.totalPages;
    const cur = currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push('...');
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #2563EB;
          --primary-dark: #1E40AF;
          --primary-light: #DBEAFE;
          --success: #22C55E;
          --warning: #FBBF24;
          --error: #EF4444;
          --neutral-50: #F9FAFB;
          --neutral-100: #F3F4F6;
          --neutral-200: #E5E7EB;
          --neutral-300: #D1D5DB;
          --neutral-400: #9CA3AF;
          --neutral-500: #6B7280;
          --neutral-600: #4B5563;
          --neutral-700: #374151;
          --neutral-800: #1F2937;
          --neutral-900: #111827;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
          color: var(--neutral-900);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .dashboard {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 320px 1fr;
          grid-template-rows: auto 1fr;
        }

        /* ============ HEADER ============ */
        .header {
          grid-column: 1 / -1;
          background: white;
          border-bottom: 1px solid var(--neutral-200);
          padding: 1.25rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: -0.5px;
        }

        .nav-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--neutral-500);
        }

        .logout-btn {
          width: 30%;
          background: white;
          border: 1px solid var(--neutral-300);
          color: var(--neutral-700);
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .logout-btn:hover {
          background: var(--neutral-50);
          border-color: var(--neutral-400);
          color: var(--neutral-900);
        }

        /* ============ SIDEBAR ============ */
        .sidebar {
          background: white;
          border-right: 1px solid var(--neutral-200);
          padding: 2rem 1.5rem;
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 2.5rem;
        }

        .sidebar-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--neutral-500);
          margin-bottom: 1rem;
        }

        .sidebar-stat {
          background: var(--neutral-50);
          padding: 1rem;
          border-radius: 0.625rem;
          margin-bottom: 0.75rem;
          border: 1px solid var(--neutral-100);
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--neutral-500);
          margin-top: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 500;
        }

        /* ============ MAIN CONTENT ============ */
        .main-wrapper {
          display: grid;
          /* Left column is fixed width; right takes remaining space */
          grid-template-columns: 340px 1fr;
          gap: 2rem;
          padding: 2rem;
          /* Let the wrapper scroll naturally — don't constrain height */
          align-items: start;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          /* Sticky so the form stays visible while scrolling the task list */
          position: sticky;
          top: 80px;
        }

        .card {
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 0.75rem;
          padding: 1.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
          border-color: var(--neutral-300);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--neutral-900);
          letter-spacing: -0.3px;
        }

        /* ============ FORM STYLES ============ */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-700);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .form-input,
        .form-textarea,
        .form-select {
          padding: 0.75rem 1rem;
          border: 1px solid var(--neutral-300);
          border-radius: 0.5rem;
          font-family: inherit;
          font-size: 0.95rem;
          color: var(--neutral-900);
          background: white;
          transition: all 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
          font-family: 'Plus Jakarta Sans', inherit;
        }

        .submit-btn {
          padding: 0.875rem 1.5rem;
          background: var(--primary);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-top: 0.5rem;
          width: 100%;
        }

        .submit-btn:hover {
          background: var(--primary-dark);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .submit-btn:active {
          transform: translateY(1px);
        }

        /* ============ FILTER & SEARCH ============ */
        .filters-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid var(--neutral-300);
          border-radius: 0.5rem;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--neutral-700);
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .search-group {
          display: flex;
          gap: 0.5rem;
          grid-column: 1 / -1;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--neutral-300);
          border-radius: 0.5rem;
          font-family: inherit;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .search-btn {
          width: 20%;
          padding: 0.75rem 1.5rem;
          background: var(--neutral-100);
          border: 1px solid var(--neutral-300);
          border-radius: 0.5rem;
          color: var(--neutral-700);
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .search-btn:hover {
          background: var(--neutral-200);
          border-color: var(--neutral-400);
        }

        /* ============ TASKS LIST ============ */
        /*
          KEY FIX: Remove max-height + overflow-y from the container.
          The outer page scroll handles scrolling — the container just stacks cards naturally.
          This prevents cards from being compressed to fit a constrained box.
        */
        .tasks-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ============ TASK CARD ============ */
        /*
          KEY FIX: No height constraints on the card itself. Padding and content
          determine the height — cards will never shrink below their natural size.
        */
        .task-card {
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 0.75rem;
          padding: 1.5rem;
          cursor: grab;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          /* Ensure card never collapses */
          width: 100%;
          min-width: 0;
        }

        .task-card:active {
          cursor: grabbing;
        }

        .task-card:hover {
          border-color: var(--primary-light);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
        }

        .task-card.dragging {
          opacity: 0.5;
          transform: scale(0.98);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .task-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-900);
          flex: 1;
          letter-spacing: -0.2px;
          /* Prevent title from forcing layout collapse */
          min-width: 0;
          word-break: break-word;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.875rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
          border: 1.5px solid;
          flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
        }

        .task-description {
          font-size: 0.9rem;
          color: var(--neutral-600);
          line-height: 1.6;
          margin-bottom: 1rem;
          word-break: break-word;
        }

        .task-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--neutral-500);
          margin-bottom: 1.25rem;
          padding: 0.75rem 0;
          border-top: 1px solid var(--neutral-100);
          border-bottom: 1px solid var(--neutral-100);
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .task-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .task-select {
          flex: 1;
          min-width: 140px;
          padding: 0.6rem 0.875rem;
          border: 1px solid var(--neutral-300);
          border-radius: 0.375rem;
          font-family: inherit;
          font-size: 0.85rem;
          color: var(--neutral-700);
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .task-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .delete-btn {
          padding: 0.6rem 1.25rem;
          background: white;
          border: 1px solid var(--neutral-300);
          border-radius: 0.375rem;
          color: var(--error);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .delete-btn:hover {
          background: #FEF2F2;
          border-color: var(--error);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
        }

        /* ============ PAGINATION ============ */
        .pagination-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.5rem;
          padding: 1rem 1.25rem;
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .pagination-info {
          font-size: 0.85rem;
          color: var(--neutral-500);
          font-weight: 500;
        }

        .pagination-info strong {
          color: var(--neutral-800);
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .page-btn {
          min-width: 2.25rem;
          height: 2.25rem;
          padding: 0 0.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--neutral-300);
          border-radius: 0.375rem;
          background: white;
          color: var(--neutral-700);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .page-btn:hover:not(:disabled) {
          background: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary-dark);
        }

        .page-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          font-weight: 700;
          pointer-events: none;
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-ellipsis {
          min-width: 2.25rem;
          height: 2.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--neutral-400);
          font-size: 0.875rem;
          pointer-events: none;
        }

        /* ============ EMPTY STATE ============ */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--neutral-700);
          margin-bottom: 0.5rem;
        }

        .empty-text {
          font-size: 0.9rem;
          color: var(--neutral-500);
        }

        /* ============ ERROR ============ */
        .error-alert {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 0.625rem;
          padding: 1rem 1.25rem;
          color: #991B1B;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        /* ============ MOBILE OVERVIEW ============ */
        .mobile-overview {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-overview {
            display: flex;
            justify-content: space-between;
            padding: 1rem;
            background: white;
            border-bottom: 1px solid var(--neutral-200);
            position: sticky;
            top: 72px;
            z-index: 90;
          }

          .mobile-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 0.75rem;
            color: var(--neutral-600);
          }

          .mobile-stat strong {
            font-size: 1rem;
            font-weight: 700;
            margin-top: 0.25rem;
            color: var(--primary);
          }
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 1200px) {
          .main-wrapper {
            grid-template-columns: 1fr;
          }

          .form-section {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            grid-template-columns: 1fr;
          }

          .sidebar {
            display: none;
          }

          .header {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .main-wrapper {
            padding: 1.5rem 1rem;
          }

          .filters-row {
            grid-template-columns: 1fr;
          }

          .search-group {
            flex-direction: column;
          }

          .task-header {
            flex-direction: column;
          }

          .pagination-wrapper {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="header">
        <div className="header-left">
          <div className="logo">Tasks</div>
          <div className="nav-breadcrumb">Dashboard / My Tasks</div>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>

      {/* ── MOBILE STATS BAR ── */}
      <div className="mobile-overview">
        <div className="mobile-stat"><span>Total</span><strong>{meta.total ?? tasks.length}</strong></div>
        <div className="mobile-stat"><span>Pending</span><strong>{tasks.filter(t => t.status === 'todo').length}</strong></div>
        <div className="mobile-stat"><span>In Progress</span><strong>{tasks.filter(t => t.status === 'in-progress').length}</strong></div>
        <div className="mobile-stat"><span>Done</span><strong>{tasks.filter(t => t.status === 'done').length}</strong></div>
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Overview</div>
          <div className="sidebar-stat">
            <div className="stat-value">{meta.total ?? tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="sidebar-stat">
            <div className="stat-value" style={{ color: '#FBBF24' }}>
              {tasks.filter(t => t.status === 'todo').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="sidebar-stat">
            <div className="stat-value" style={{ color: '#3B82F6' }}>
              {tasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="sidebar-stat">
            <div className="stat-value" style={{ color: '#22C55E' }}>
              {tasks.filter(t => t.status === 'done').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-wrapper">

        {/* Left: create-task form */}
        <div className="form-section">
          <div className="card">
            <h3 className="card-title">New Task</h3>
            <form onSubmit={createTask}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  placeholder="Task title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add details about this task..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="todo">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Completed</option>
                </select>
              </div>

              <button type="submit" className="submit-btn">Create Task</button>
            </form>
          </div>
        </div>

        {/* Right: filters + task list + pagination */}
        <div>
          {/* Filters */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="filters-row">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="todo">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Completed</option>
              </select>

              {/* spacer cell */}
              <div />

              <div className="search-group">
                <input
                  className="search-input"
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadTasks(1)}
                />
                <button className="search-btn" onClick={() => loadTasks(1)} type="button">
                  Search
                </button>
              </div>
            </div>
          </div>

          {error && <div className="error-alert">⚠ {error}</div>}

          {/* Task cards */}
          <div className="tasks-container">
            {sortedTasks.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No tasks yet</div>
                <div className="empty-text">Create a task from the left panel to get started</div>
              </div>
            ) : (
              sortedTasks.map((task, index) => {
                const statusColor = getStatusColor(task.status);
                return (
                  <div
                    key={task._id}
                    className={`task-card${draggedTask?._id === task._id ? ' dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="task-header">
                      <h3 className="task-title">{task.title}</h3>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: statusColor.bg,
                          borderColor: statusColor.border,
                          color: statusColor.text,
                        }}
                      >
                        {getStatusLabel(task.status)}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-description">
                        <strong>Description</strong>: {task.description}
                      </p>
                    )}

                    <div className="task-meta">
                      <span>Created {formatDate(task.createdAt)}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ID: {task._id.slice(-8)}
                      </span>
                    </div>

                    <div className="task-actions">
                      <select
                        className="task-select"
                        value={task.status}
                        onChange={(e) => updateStatus(task._id, e.target.value)}
                      >
                        <option value="todo">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Completed</option>
                      </select>
                      <button className="delete-btn" onClick={() => deleteTask(task._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Page <strong>{currentPage}</strong> of <strong>{meta.totalPages}</strong>
                {meta.total != null && (
                  <> &mdash; <strong>{meta.total}</strong> total tasks</>
                )}
              </div>

              <div className="pagination-controls">
                {/* Prev */}
                <button
                  className="page-btn"
                  onClick={() => loadTasks(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {/* Page numbers */}
                {getPaginationPages().map((p, i) =>
                  p === '...'
                    ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                    : (
                      <button
                        key={p}
                        className={`page-btn${p === currentPage ? ' active' : ''}`}
                        onClick={() => loadTasks(p)}
                      >
                        {p}
                      </button>
                    )
                )}

                {/* Next */}
                <button
                  className="page-btn"
                  onClick={() => loadTasks(currentPage + 1)}
                  disabled={currentPage >= meta.totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}