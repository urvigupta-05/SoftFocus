import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/notes.css';

// ── Tag definitions ──────────────────────────────────────────────────────────
const TAGS = [
  { id: 'focus',   label: 'Focus',   color: '#c4893a', bg: '#fdf5e8' },
  { id: 'ideas',   label: 'Ideas',   color: '#7a9e8e', bg: '#edf5f1' },
  { id: 'reading', label: 'Reading', color: '#8878a8', bg: '#f4f0fb' },
  { id: 'work',    label: 'Work',    color: '#b87070', bg: '#fdf0f0' },
  { id: 'misc',    label: 'Misc',    color: '#9e9488', bg: '#f3efe9' },
];

// ── localStorage helpers ─────────────────────────────────────────────────────
const NOTES_KEY = (email) => `pomo_notes_${email}`;

function loadNotes(email) {
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem(NOTES_KEY(email)) || '[]'); }
  catch { return []; }
}

function saveNotes(email, notes) {
  if (!email) return;
  localStorage.setItem(NOTES_KEY(email), JSON.stringify(notes));
}

function createNote(overrides = {}) {
  return {
    id: Date.now(),
    title: '',
    body: '',
    tag: 'misc',
    items: [],
    completed: false,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createItem(text = '') {
  return { id: Date.now() + Math.random(), text, done: false };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTagDef(id) {
  return TAGS.find(t => t.id === id) || TAGS[4];
}

function notePreview(note) {
  if (note.body.trim()) return note.body.trim().slice(0, 60);
  if (note.items.length) return note.items.map(i => i.text).filter(Boolean).join(', ').slice(0, 60);
  return 'Empty note';
}

function checklistProgress(items) {
  if (!items.length) return null;
  const done = items.filter(i => i.done).length;
  return { done, total: items.length };
}

// ── Note List Item ───────────────────────────────────────────────────────────
function NoteListItem({ note, isActive, onClick }) {
  const tag = getTagDef(note.tag);
  const progress = checklistProgress(note.items);

  return (
    <div
      className={`note-list-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div
        className="nli-tag"
        style={{ color: tag.color, background: tag.bg }}
      >
        {note.pinned && '📌 '}
        {tag.label}
      </div>
      <div className={`nli-title ${note.completed ? 'completed' : ''}`}>
        {note.title || 'Untitled note'}
      </div>
      <div className="nli-preview">{notePreview(note)}</div>
      <div className="nli-meta">
        <span className="nli-date">{formatDate(note.updatedAt)}</span>
        {progress && (
          <span className="nli-checks">
            {progress.done}/{progress.total} ✓
          </span>
        )}
      </div>
    </div>
  );
}

// ── Checklist Item ───────────────────────────────────────────────────────────
function ChecklistItem({ item, onToggle, onChangeText, onDelete, onEnter }) {
  const inputRef = useRef(null);

  return (
    <div className={`checklist-item ${item.done ? 'done' : ''}`}>
      <div
        className={`ci-checkbox ${item.done ? 'checked' : ''}`}
        onClick={onToggle}
      />
      <input
        ref={inputRef}
        className={`ci-text ${item.done ? 'done' : ''}`}
        value={item.text}
        placeholder="Task item…"
        onChange={e => onChangeText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onEnter(); }
          if (e.key === 'Backspace' && !item.text) { e.preventDefault(); onDelete(); }
        }}
      />
      <button className="ci-delete" onClick={onDelete}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ── Editor Panel ─────────────────────────────────────────────────────────────
function NoteEditor({ note, onUpdate, onDelete, onToggleComplete, onTogglePin }) {
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);
  const tag = getTagDef(note.tag);
  const progress = checklistProgress(note.items);

  const triggerSave = useCallback(() => {
    setSaved(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  const update = useCallback((patch) => {
    onUpdate({ ...note, ...patch, updatedAt: new Date().toISOString() });
    triggerSave();
  }, [note, onUpdate, triggerSave]);

  // Item operations
  const addItem = () => {
    const newItem = createItem('');
    update({ items: [...note.items, newItem] });
    // focus the new input after render
    setTimeout(() => {
      const inputs = document.querySelectorAll('.ci-text');
      if (inputs.length) inputs[inputs.length - 1].focus();
    }, 50);
  };

  const toggleItem = (id) => {
    update({ items: note.items.map(it => it.id === id ? { ...it, done: !it.done } : it) });
  };

  const changeItemText = (id, text) => {
    update({ items: note.items.map(it => it.id === id ? { ...it, text } : it) });
  };

  const deleteItem = (id) => {
    update({ items: note.items.filter(it => it.id !== id) });
  };

  const insertItemAfter = (id) => {
    const idx = note.items.findIndex(it => it.id === id);
    const newItems = [...note.items];
    newItems.splice(idx + 1, 0, createItem(''));
    update({ items: newItems });
    setTimeout(() => {
      const inputs = document.querySelectorAll('.ci-text');
      if (inputs[idx + 1]) inputs[idx + 1].focus();
    }, 50);
  };

  const doneCount = note.items.filter(i => i.done).length;
  const allDone = note.items.length > 0 && doneCount === note.items.length;

  return (
    <>
      {/* Toolbar */}
      <div className="notes-toolbar">
        <div className="notes-toolbar-left">
          {/* Tag selector */}
          <div className="tag-selector">
            {TAGS.map(t => (
              <button
                key={t.id}
                className={`tag-chip ${note.tag === t.id ? 'selected' : ''}`}
                style={{
                  color: t.color,
                  background: note.tag === t.id ? t.bg : 'transparent',
                  borderColor: note.tag === t.id ? t.color + '55' : 'transparent',
                }}
                onClick={() => update({ tag: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="notes-toolbar-right">
          {/* Save indicator */}
          <div className={`save-indicator ${saved ? 'visible' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Saved
          </div>

          <div className="tb-sep" />

          {/* Pin */}
          <button
            className="tb-btn"
            title={note.pinned ? 'Unpin' : 'Pin to top'}
            onClick={() => update({ pinned: !note.pinned })}
            style={{ color: note.pinned ? 'var(--amber)' : undefined }}
          >
            📌
          </button>

          {/* Mark complete */}
          <button
            className="tb-btn"
            title={note.completed ? 'Mark incomplete' : 'Mark complete'}
            onClick={onToggleComplete}
            style={{ color: note.completed ? 'var(--sage)' : undefined }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>

          <div className="tb-sep" />

          {/* Delete */}
          <button className="tb-btn danger" title="Delete note" onClick={onDelete}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
              <path d="M10,11v6"/><path d="M14,11v6"/>
              <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="notes-editor-wrap">
        {note.completed && (
          <div className="note-done-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Note marked as complete. Click the ✓ button to reopen.
          </div>
        )}

        <input
          className="note-title-input"
          placeholder="Note title…"
          value={note.title}
          onChange={e => update({ title: e.target.value })}
        />

        <div className="note-meta-row">
          <span className="note-meta-date">{formatDate(note.updatedAt)}</span>
          <span
            className="note-meta-tag"
            style={{ color: tag.color, background: tag.bg }}
          >
            {tag.label}
          </span>
          {progress && (
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 300 }}>
              {progress.done} of {progress.total} tasks done
              {allDone && ' 🎉'}
            </span>
          )}
        </div>

        <textarea
          className="note-body-input"
          placeholder="Start writing your note…"
          value={note.body}
          rows={6}
          onChange={e => update({ body: e.target.value })}
        />

        {/* Checklist */}
        <div className="checklist-section">
          <div className="checklist-title">
            Checklist
            {progress && (
              <span className="checklist-progress-mini">
                {progress.done}/{progress.total}
              </span>
            )}
          </div>

          <div className="checklist-items">
            {note.items.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item.id)}
                onChangeText={text => changeItemText(item.id, text)}
                onDelete={() => deleteItem(item.id)}
                onEnter={() => insertItemAfter(item.id)}
              />
            ))}
          </div>

          <button className="btn-add-item" onClick={addItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add item
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Notes Page ──────────────────────────────────────────────────────────
export default function NotesPage() {
  const { user } = useApp();
  const email = user?.email;

  const [notes, setNotes] = useState(() => loadNotes(email));
  const [activeId, setActiveId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'done' | 'pinned'

  // Persist notes on change
  useEffect(() => {
    saveNotes(email, notes);
  }, [notes, email]);

  // Sorted + filtered
  const filteredNotes = notes
    .filter(n => {
      if (filter === 'active')  return !n.completed;
      if (filter === 'done')    return n.completed;
      if (filter === 'pinned')  return n.pinned;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  const activeNote = notes.find(n => n.id === activeId) || null;

  const createNewNote = () => {
    const note = createNote();
    setNotes(prev => [note, ...prev]);
    setActiveId(note.id);
  };

  const updateNote = useCallback((updated) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  }, []);

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveId(prev => prev === id ? null : prev);
  }, []);

  const toggleComplete = useCallback((id) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, completed: !n.completed, updatedAt: new Date().toISOString() } : n
    ));
  }, []);

  return (
    <div className="notes-page">
      {/* Sidebar */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <div className="notes-sidebar-title">Notes &amp; tasks</div>
          <button className="btn-new-note" onClick={createNewNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New note
          </button>
        </div>

        {/* Filter tabs */}
        <div className="notes-filter-tabs">
          {[
            { id: 'all',    label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'done',   label: 'Done' },
            { id: 'pinned', label: '📌' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`nf-tab ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="notes-empty">
              <div className="notes-empty-icon">
                {filter === 'done' ? '✅' : filter === 'pinned' ? '📌' : '📝'}
              </div>
              <div className="notes-empty-text">
                {filter === 'done'   && 'No completed notes yet.'}
                {filter === 'pinned' && 'No pinned notes yet.'}
                {filter === 'active' && 'No active notes.'}
                {filter === 'all'    && 'No notes yet.\nCreate your first one!'}
              </div>
            </div>
          ) : (
            filteredNotes.map(note => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={note.id === activeId}
                onClick={() => setActiveId(note.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main editor */}
      <div className="notes-main">
        {activeNote ? (
          <NoteEditor
            note={activeNote}
            onUpdate={updateNote}
            onDelete={() => deleteNote(activeNote.id)}
            onToggleComplete={() => toggleComplete(activeNote.id)}
            onTogglePin={() => updateNote({ ...activeNote, pinned: !activeNote.pinned, updatedAt: new Date().toISOString() })}
          />
        ) : (
          <div className="notes-no-selection">
            <div className="notes-no-selection-icon">📝</div>
            <h3>Notes &amp; <em>tasks</em></h3>
            <p>
              Select a note to edit it, or create a new one.
              Add checklists, colour-coded tags, and pin important notes to the top.
            </p>
            <button
              className="btn-next"
              onClick={createNewNote}
              style={{ marginTop: 8 }}
            >
              Create first note →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
