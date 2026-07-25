/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowLeft, BarChart2, Trash2, Edit2, Plus, X, Save } from 'lucide-react'
import { Confetti } from '@/components/ui/Confetti'
import { RoadmapDetailSkeleton } from '@/components/ui/PageState'

const CHIP: Record<string, string> = { sql: 'chip-sql', python: 'chip-python', bi: 'chip-bi', ai: 'chip-ai', git: 'chip-git', js: 'chip-js' }
const BAR: Record<string, string> = { violet: '#4F6BFF', blue: '#0A9EFF', green: '#30D158', amber: '#FF9F0A', red: '#FF453A', teal: '#40C8E0', pink: '#FF375F' }

const colorOptions = [
  { value: 'violet', label: 'Cobalt', hex: '#4F6BFF' },
  { value: 'blue', label: 'Sky', hex: '#0A9EFF' },
  { value: 'green', label: 'Mint', hex: '#30D158' },
  { value: 'amber', label: 'Amber', hex: '#FF9F0A' },
  { value: 'red', label: 'Red', hex: '#FF453A' },
  { value: 'teal', label: 'Teal', hex: '#40C8E0' },
  { value: 'pink', label: 'Pink', hex: '#FF375F' },
]

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rm, setRm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeProj, setActiveProj] = useState(-1) // Default to -1 (All Days)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [celebrateId, setCelebrateId] = useState<string | null>(null)

  // Edit Mode States
  const [editMode, setEditMode] = useState(false)
  
  // Modals States
  const [isEditingRoadmap, setIsEditingRoadmap] = useState(false)
  const [roadmapForm, setRoadmapForm] = useState({ title: '', goal: '', color: 'violet' })

  const [editingProject, setEditingProject] = useState<any>(null)
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', color: 'blue', startDay: 1, endDay: 30 })

  const [editingTask, setEditingTask] = useState<any>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    day: 1,
    description: '',
    techStackRaw: '',
    resources: [] as { name: string; url: string }[],
    projectId: '' as string | null,
  })
  const [newRes, setNewRes] = useState({ name: '', url: '' })

  const fetchRoadmap = useCallback(() => {
    fetch(`/api/roadmaps/${id}`).then(r => r.json()).then(d => { 
      setRm(d)
      setLoading(false) 
    })
  }, [id])

  useEffect(() => {
    fetchRoadmap()
  }, [fetchRoadmap])

  async function toggleTask(task: any) {
    const newDone = !task.done
    setRm((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === task.id ? { ...t, done: newDone } : t) }))
    if (newDone) {
      setCelebrateId(task.id)
      setTimeout(() => setCelebrateId((cur: string | null) => cur === task.id ? null : cur), 850)
    }
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone })
    })
    fetch(`/api/roadmaps/${id}`).then(r => r.json()).then(setRm)
  }

  async function deleteRoadmap() {
    if (!confirm('Delete this roadmap?')) return
    await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  async function generateReport() {
    await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roadmapId: id }) })
    router.push(`/reports?roadmapId=${id}`)
  }

  // Roadmap edits
  function startEditRoadmap() {
    setRoadmapForm({ title: rm.title, goal: rm.goal, color: rm.color })
    setIsEditingRoadmap(true)
  }

  async function saveRoadmapDetails() {
    const res = await fetch(`/api/roadmaps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roadmapForm),
    })
    if (res.ok) {
      setIsEditingRoadmap(false)
      fetchRoadmap()
    }
  }

  // Project edits
  function startEditProject(project: any) {
    setProjectForm({ name: project.name, color: project.color, startDay: project.startDay, endDay: project.endDay })
    setEditingProject(project)
  }

  async function saveProjectDetails() {
    const res = await fetch(`/api/projects/${editingProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectForm),
    })
    if (res.ok) {
      setEditingProject(null)
      fetchRoadmap()
    }
  }

  async function deleteProject(projectId: string) {
    if (!confirm('Are you sure you want to delete this phase? All tasks in this phase will lose their phase link.')) return
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    if (res.ok) {
      setEditingProject(null)
      setActiveProj(-1)
      fetchRoadmap()
    }
  }

  async function createProject() {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...projectForm, roadmapId: id }),
    })
    if (res.ok) {
      setIsAddingProject(false)
      fetchRoadmap()
    }
  }

  // Task edits
  function startEditTask(task: any) {
    const tech = task.techStack as any[] || []
    setTaskForm({
      title: task.title,
      day: task.day,
      description: task.description || '',
      techStackRaw: tech.map((t: any) => t.name).join(', '),
      resources: task.resources as any[] || [],
      projectId: task.projectId || '',
    })
    setEditingTask(task)
  }

  async function saveTaskDetails() {
    const techStack = taskForm.techStackRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name, type: 'other' }))

    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskForm.title,
        day: taskForm.day,
        description: taskForm.description,
        techStack,
        resources: taskForm.resources,
        projectId: taskForm.projectId || null,
      }),
    })
    if (res.ok) {
      setEditingTask(null)
      fetchRoadmap()
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    if (res.ok) {
      setEditingTask(null)
      fetchRoadmap()
    }
  }

  async function createTask() {
    const techStack = taskForm.techStackRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name, type: 'other' }))

    const assignedProjectId = taskForm.projectId || (activeProj >= 0 ? projects[activeProj]?.id : null)

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roadmapId: id,
        projectId: assignedProjectId || null,
        title: taskForm.title,
        day: taskForm.day,
        description: taskForm.description,
        techStack,
        resources: taskForm.resources,
      }),
    })
    if (res.ok) {
      setIsAddingTask(false)
      fetchRoadmap()
    }
  }

  function addResource() {
    if (!newRes.name.trim() || !newRes.url.trim()) return
    setTaskForm(prev => ({
      ...prev,
      resources: [...prev.resources, { name: newRes.name.trim(), url: newRes.url.trim() }]
    }))
    setNewRes({ name: '', url: '' })
  }

  function removeResource(index: number) {
    setTaskForm(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }))
  }

  if (loading || !rm) return <RoadmapDetailSkeleton />

  const projects = rm.projects || []
  const tasks = rm.tasks || []
  const done = tasks.filter((t: any) => t.done).length
  const pct = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0
  const color = BAR[rm.color] || BAR.violet
  const proj = activeProj >= 0 ? projects[activeProj] : null
  const projTasks = activeProj >= 0
    ? tasks.filter((t: any) => t.projectId === proj?.id).sort((a: any, b: any) => a.day - b.day)
    : [...tasks].sort((a: any, b: any) => a.day - b.day)

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '3px' }}>{rm.title}</h1>
            <button onClick={startEditRoadmap} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'inline-flex', padding: '4px' }}>
              <Edit2 size={14} />
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>{rm.goal}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditMode(!editMode)} className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-ghost'}`}>
            <Edit2 size={13} /> {editMode ? 'Stop Editing' : 'Edit Roadmap'}
          </button>
          <button onClick={generateReport} className="btn btn-ghost btn-sm"><BarChart2 size={13} /> Report</button>
          <button onClick={deleteRoadmap} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Progress */}
      <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color, letterSpacing: '-1px' }}>{pct}%</span>
          <span style={{ fontSize: '13px', color: 'var(--text3)' }}>{done} / {tasks.length} days</span>
        </div>
        <div style={{ height: '4px', background: 'var(--bg5)', borderRadius: '2px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {[...tasks].sort((a: any, b: any) => a.day - b.day).map((t: any) => (
            <button key={t.id} title={`Day ${t.day}: ${t.title}`} onClick={() => toggleTask(t)} style={{
              width: '22px', height: '22px', borderRadius: '4px', border: 'none', cursor: 'pointer',
              background: t.done ? color : 'var(--bg4)', opacity: t.done ? 1 : 0.5, transition: 'all 0.15s'
            }} />
          ))}
        </div>
      </div>

      {/* Project tabs & manager */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <button onClick={() => setActiveProj(-1)} style={{
          padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
          background: activeProj === -1 ? color : 'var(--bg3)',
          color: activeProj === -1 ? '#fff' : 'var(--text3)',
          fontSize: '13px', fontWeight: activeProj === -1 ? '600' : '400',
          fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          All Days <span style={{ opacity: 0.7, fontSize: '11px' }}>{tasks.length}</span>
        </button>

        {projects.map((p: any, i: number) => {
          const pT = tasks.filter((t: any) => t.projectId === p.id)
          const pPct = pT.length > 0 ? Math.round(pT.filter((t: any) => t.done).length / pT.length * 100) : 0
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setActiveProj(i)} style={{
                padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: activeProj === i ? color : 'var(--bg3)',
                color: activeProj === i ? '#fff' : 'var(--text3)',
                fontSize: '13px', fontWeight: activeProj === i ? '600' : '400',
                fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {p.name} <span style={{ opacity: 0.7, fontSize: '11px' }}>{pPct}%</span>
              </button>
              {editMode && (
                <button onClick={() => startEditProject(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: '4px' }}>
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )
        })}
        {editMode && (
          <button onClick={() => { setProjectForm({ name: '', color: 'blue', startDay: 1, endDay: 30 }); setIsAddingProject(true) }} style={{
            padding: '6px 12px', borderRadius: '999px', border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text3)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Plus size={13} /> Add Phase
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {projTasks.map((task: any) => {
          const isExp = expanded === task.id
          const tech = task.techStack as any[] || []
          const res = task.resources as any[] || []
          return (
            <div key={task.id} className="card-feed" style={{ opacity: task.done ? 0.65 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                <button onClick={() => toggleTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.done ? 'var(--green)' : 'var(--text4)', display: 'flex', flexShrink: 0, position: 'relative' }}>
                  <span className={celebrateId === task.id ? 'check-pop' : ''} style={{ display: 'flex' }}>
                    {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </span>
                  <Confetti fire={celebrateId === task.id} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text4)' }}>Day {task.day}</span>
                    {tech.slice(0, 3).map((t: any, i: number) => <span key={i} className={`chip ${CHIP[t.type] || 'chip-default'}`}>{t.name}</span>)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: task.done ? 'var(--text4)' : '#fff', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
                  {task.description && !isExp && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                </div>
                
                {editMode && (
                  <button onClick={() => startEditTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', marginRight: '8px' }}>
                    <Edit2 size={14} />
                  </button>
                )}

                <button onClick={() => setExpanded(isExp ? null : task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex' }}>
                  {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
              {isExp && (
                <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                  {task.description && <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '12px 0 10px', lineHeight: '1.6' }}>{task.description}</p>}
                  {tech.length > 0 && <div style={{ marginBottom: '10px' }}><div className="section-title">Tech Stack</div><div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>{tech.map((t: any, i: number) => <span key={i} className={`chip ${CHIP[t.type] || 'chip-default'}`}>{t.name}</span>)}</div></div>}
                  {res.length > 0 && <div><div className="section-title">Resources</div><div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>{res.map((r: any, i: number) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none' }}>→ {r.name}</a>)}</div></div>}
                </div>
              )}
            </div>
          )
        })}

        {projTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            No tasks in this phase yet.
          </div>
        )}

        {editMode && (
          <button onClick={() => {
            setTaskForm({
              title: '',
              day: tasks.length + 1,
              description: '',
              techStackRaw: '',
              resources: [],
              projectId: activeProj >= 0 ? projects[activeProj]?.id : '',
            });
            setIsAddingTask(true);
          }} style={{
            marginTop: '10px', padding: '14px', border: '1px dashed var(--border)', background: 'transparent',
            borderRadius: '12px', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
          }}>
            <Plus size={16} /> Add Day/Task
          </button>
        )}
      </div>

      {/* ROADMAP EDIT MODAL */}
      {isEditingRoadmap && (
        <Modal title="Edit Roadmap Details" onClose={() => setIsEditingRoadmap(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Title</label>
              <input className="input" value={roadmapForm.title} onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Primary Goal</label>
              <input className="input" value={roadmapForm.goal} onChange={(e) => setRoadmapForm({ ...roadmapForm, goal: e.target.value })} />
            </div>
            <div>
              <label className="label">Color</label>
              <select className="input" value={roadmapForm.color} onChange={(e) => setRoadmapForm({ ...roadmapForm, color: e.target.value })}>
                {colorOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={saveRoadmapDetails}><Save size={14} /> Save Roadmap</button>
          </div>
        </Modal>
      )}

      {/* ADD PROJECT MODAL */}
      {isAddingProject && (
        <Modal title="Add Phase/Project" onClose={() => setIsAddingProject(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Phase Name</label>
              <input className="input" placeholder="e.g. Phase 2: Advanced Topics" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="label">Start Day</label>
                <input className="input" type="number" value={projectForm.startDay} onChange={(e) => setProjectForm({ ...projectForm, startDay: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">End Day</label>
                <input className="input" type="number" value={projectForm.endDay} onChange={(e) => setProjectForm({ ...projectForm, endDay: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <select className="input" value={projectForm.color} onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })}>
                {colorOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={createProject} disabled={!projectForm.name.trim()}><Plus size={14} /> Create Phase</button>
          </div>
        </Modal>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <Modal title="Edit Phase/Project" onClose={() => setEditingProject(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Phase Name</label>
              <input className="input" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="label">Start Day</label>
                <input className="input" type="number" value={projectForm.startDay} onChange={(e) => setProjectForm({ ...projectForm, startDay: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">End Day</label>
                <input className="input" type="number" value={projectForm.endDay} onChange={(e) => setProjectForm({ ...projectForm, endDay: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <select className="input" value={projectForm.color} onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })}>
                {colorOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProjectDetails} disabled={!projectForm.name.trim()}><Save size={14} /> Save</button>
              <button className="btn btn-danger" onClick={() => deleteProject(editingProject.id)}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD TASK MODAL */}
      {isAddingTask && (
        <Modal title="Add Task/Day" onClose={() => setIsAddingTask(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px' }}>
              <div>
                <label className="label">Task Title</label>
                <input className="input" placeholder="e.g. Learn Hooks" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Day</label>
                <input className="input" type="number" value={taskForm.day} onChange={(e) => setTaskForm({ ...taskForm, day: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="label">Phase / Stage</label>
              <select className="input" value={taskForm.projectId || ''} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value || null })}>
                <option value="">No Phase (General Timeline)</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description / Instructions</label>
              <textarea className="input" style={{ minHeight: '80px' }} placeholder="Detail instructions for this day..." value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Tech Stack (comma-separated)</label>
              <input className="input" placeholder="e.g. React, TypeScript" value={taskForm.techStackRaw} onChange={(e) => setTaskForm({ ...taskForm, techStackRaw: e.target.value })} />
            </div>
            
            {/* Resources manager */}
            <div>
              <label className="label">Resources</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {taskForm.resources.map((res, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: '6px', fontSize: '12px' }}>
                    <span>{res.name} ({res.url})</span>
                    <button onClick={() => removeResource(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
                <input className="input" style={{ fontSize: '12px' }} placeholder="Name (e.g. React Docs)" value={newRes.name} onChange={(e) => setNewRes({ ...newRes, name: e.target.value })} />
                <input className="input" style={{ fontSize: '12px' }} placeholder="URL (e.g. https://...)" value={newRes.url} onChange={(e) => setNewRes({ ...newRes, url: e.target.value })} />
                <button type="button" className="btn btn-ghost" style={{ padding: '0 10px' }} onClick={addResource}>Add</button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={createTask} disabled={!taskForm.title.trim()}><Plus size={14} /> Add Task</button>
          </div>
        </Modal>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <Modal title="Edit Task/Day" onClose={() => setEditingTask(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px' }}>
              <div>
                <label className="label">Task Title</label>
                <input className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Day</label>
                <input className="input" type="number" value={taskForm.day} onChange={(e) => setTaskForm({ ...taskForm, day: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="label">Phase / Stage</label>
              <select className="input" value={taskForm.projectId || ''} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value || null })}>
                <option value="">No Phase (General Timeline)</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description / Instructions</label>
              <textarea className="input" style={{ minHeight: '80px' }} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Tech Stack (comma-separated)</label>
              <input className="input" value={taskForm.techStackRaw} onChange={(e) => setTaskForm({ ...taskForm, techStackRaw: e.target.value })} />
            </div>
            
            {/* Resources manager */}
            <div>
              <label className="label">Resources</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {taskForm.resources.map((res, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: '6px', fontSize: '12px' }}>
                    <span>{res.name} ({res.url})</span>
                    <button onClick={() => removeResource(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
                <input className="input" style={{ fontSize: '12px' }} placeholder="Name (e.g. React Docs)" value={newRes.name} onChange={(e) => setNewRes({ ...newRes, name: e.target.value })} />
                <input className="input" style={{ fontSize: '12px' }} placeholder="URL (e.g. https://...)" value={newRes.url} onChange={(e) => setNewRes({ ...newRes, url: e.target.value })} />
                <button type="button" className="btn btn-ghost" style={{ padding: '0 10px' }} onClick={addResource}>Add</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveTaskDetails} disabled={!taskForm.title.trim()}><Save size={14} /> Save Changes</button>
              <button className="btn btn-danger" onClick={() => deleteTask(editingTask.id)}><Trash2 size={14} /> Delete Task</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: '#1C1C1E', border: '1px solid var(--border2)',
        borderRadius: '16px', width: '100%', maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(245,245,247,0.06)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.4)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
