/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'prisma-fallback-db.json')

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      roadmaps: [],
      projects: [],
      tasks: [],
      reminders: [],
      settings: [],
      reports: []
    }, null, 2))
  }
}

function getDB() {
  initDB()
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch (e) {
    return { roadmaps: [], projects: [], tasks: [], reminders: [], settings: [], reports: [] }
  }
}

function saveDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function createMockPrisma() {
  initDB()
  
  const createModelProxy = (modelName: string) => {
    const tableKey = modelName === 'roadmap' ? 'roadmaps' :
                     modelName === 'project' ? 'projects' :
                     modelName === 'task' ? 'tasks' :
                     modelName === 'reminder' ? 'reminders' :
                     modelName === 'settings' ? 'settings' :
                     modelName === 'report' ? 'reports' : modelName + 's'

    return {
      findMany: async (args: any = {}) => {
        const db = getDB()
        let list = db[tableKey] || []
        
        // Simple where filtering
        if (args.where) {
          list = list.filter((item: any) => {
            for (const [key, val] of Object.entries(args.where)) {
              if (val && typeof val === 'object') {
                if ('id' in val) continue
                if ('userId' in val) {
                  const roadmap = db.roadmaps.find((r: any) => r.id === item.roadmapId)
                  if (!roadmap || roadmap.userId !== (val as any).userId) return false
                  continue
                }
              }
              if (item[key] !== val) return false
            }
            return true
          })
        }
        
        // Simple sorting
        if (args.orderBy) {
          const keys = Object.keys(args.orderBy)
          if (keys.length > 0) {
            const k = keys[0]
            const direction = args.orderBy[k] === 'desc' ? -1 : 1
            list.sort((a: any, b: any) => {
              if (a[k] < b[k]) return -1 * direction
              if (a[k] > b[k]) return 1 * direction
              return 0
            })
          }
        }
        
        // Simple include
        if (args.include) {
          list = list.map((item: any) => {
            const enriched = { ...item }
            if (args.include.projects) {
              const projects = db.projects || []
              enriched.projects = projects.filter((p: any) => p.roadmapId === item.id).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            }
            if (args.include.tasks) {
              const tasks = db.tasks || []
              enriched.tasks = tasks.filter((t: any) => t.roadmapId === item.id).sort((a: any, b: any) => (a.day || 0) - (b.day || 0))
            }
            if (args.include.reminders) {
              const reminders = db.reminders || []
              enriched.reminders = reminders.filter((r: any) => r.roadmapId === item.id)
            }
            if (args.include.report) {
              const reports = db.reports || []
              enriched.report = reports.find((r: any) => r.roadmapId === item.id) || null
            }
            if (args.include._count) {
              enriched._count = {
                tasks: (db.tasks || []).filter((t: any) => t.roadmapId === item.id).length
              }
            }
            return enriched
          })
        }
        return list
      },
      
      findFirst: async (args: any = {}) => {
        const db = getDB()
        let list = db[tableKey] || []
        if (args.where) {
          list = list.filter((item: any) => {
            for (const [key, val] of Object.entries(args.where)) {
              if (val && typeof val === 'object') {
                if ('userId' in val) {
                  const roadmap = db.roadmaps.find((r: any) => r.id === item.roadmapId)
                  if (!roadmap || roadmap.userId !== (val as any).userId) return false
                  continue
                }
                if ('id' in val) continue
              }
              if (item[key] !== val) return false
            }
            return true
          })
        }
        
        if (args.orderBy) {
          const keys = Object.keys(args.orderBy)
          if (keys.length > 0) {
            const k = keys[0]
            const direction = args.orderBy[k] === 'desc' ? -1 : 1
            list.sort((a: any, b: any) => {
              if (a[k] < b[k]) return -1 * direction
              if (a[k] > b[k]) return 1 * direction
              return 0
            })
          }
        }
        
        let item = list[0] || null
        if (item && args.include) {
          const enriched = { ...item }
          if (args.include.projects) enriched.projects = (db.projects || []).filter((p: any) => p.roadmapId === item.id)
          if (args.include.tasks) enriched.tasks = (db.tasks || []).filter((t: any) => t.roadmapId === item.id)
          if (args.include.reminders) enriched.reminders = (db.reminders || []).filter((r: any) => r.roadmapId === item.id)
          if (args.include.report) enriched.report = (db.reports || []).find((r: any) => r.roadmapId === item.id) || null
          item = enriched
        }
        return item
      },
      
      findUnique: async (args: any = {}) => {
        const db = getDB()
        const list = db[tableKey] || []
        let item = list.find((x: any) => {
          if (args.where.id !== undefined && x.id === args.where.id) return true
          if (args.where.userId !== undefined && x.userId === args.where.userId) return true
          if (args.where.roadmapId !== undefined && x.roadmapId === args.where.roadmapId) return true
          return false
        }) || null
        
        if (item && args.include) {
          const enriched = { ...item }
          if (args.include.projects) enriched.projects = (db.projects || []).filter((p: any) => p.roadmapId === item.id)
          if (args.include.tasks) enriched.tasks = (db.tasks || []).filter((t: any) => t.roadmapId === item.id)
          if (args.include.reminders) enriched.reminders = (db.reminders || []).filter((r: any) => r.roadmapId === item.id)
          if (args.include.report) enriched.report = (db.reports || []).find((r: any) => r.roadmapId === item.id) || null
          item = enriched
        }
        return item
      },
      
      count: async (args: any = {}) => {
        const db = getDB()
        let list = db[tableKey] || []
        if (args.where) {
          list = list.filter((item: any) => {
            for (const [key, val] of Object.entries(args.where)) {
              if (item[key] !== val) return false
            }
            return true
          })
        }
        return list.length
      },
      
      create: async (args: any = {}) => {
        const db = getDB()
        const newItem = {
          id: Math.random().toString(36).substring(2, 11),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...args.data
        }
        
        if (args.data.projects?.create) {
          const projs = args.data.projects.create.map((p: any, idx: number) => ({
            id: Math.random().toString(36).substring(2, 11),
            roadmapId: newItem.id,
            order: idx,
            ...p
          }))
          db.projects = [...(db.projects || []), ...projs]
          newItem.projects = projs
          delete newItem.projects
        }
        
        if (args.data.phases?.create) {
          delete newItem.phases
        }
        
        db[tableKey] = [...(db[tableKey] || []), newItem]
        saveDB(db)
        
        if (args.include?.projects) {
          newItem.projects = (db.projects || []).filter((p: any) => p.roadmapId === newItem.id)
        }
        return newItem
      },
      
      createMany: async (args: any = {}) => {
        const db = getDB()
        const items = (args.data || []).map((x: any) => ({
          id: Math.random().toString(36).substring(2, 11),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...x
        }))
        db[tableKey] = [...(db[tableKey] || []), ...items]
        saveDB(db)
        return { count: items.length }
      },
      
      update: async (args: any = {}) => {
        const db = getDB()
        const list = db[tableKey] || []
        const index = list.findIndex((x: any) => x.id === args.where.id)
        if (index === -1) throw new Error(`Record not found for update`)
        
        const updated = {
          ...list[index],
          ...args.data,
          updatedAt: new Date().toISOString()
        }
        list[index] = updated
        db[tableKey] = list
        saveDB(db)
        return updated
      },
      
      upsert: async (args: any = {}) => {
        const db = getDB()
        const list = db[tableKey] || []
        const index = list.findIndex((x: any) => {
          if (args.where.userId !== undefined && x.userId === args.where.userId) return true
          if (args.where.id !== undefined && x.id === args.where.id) return true
          return false
        })
        
        if (index !== -1) {
          const updated = {
            ...list[index],
            ...args.update,
            updatedAt: new Date().toISOString()
          }
          list[index] = updated
          db[tableKey] = list
          saveDB(db)
          return updated
        } else {
          const newItem = {
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...args.create
          }
          db[tableKey] = [...(db[tableKey] || []), newItem]
          saveDB(db)
          return newItem
        }
      },
      
      delete: async (args: any = {}) => {
        const db = getDB()
        const list = db[tableKey] || []
        const index = list.findIndex((x: any) => x.id === args.where.id)
        if (index !== -1) {
          const removed = list.splice(index, 1)[0]
          db[tableKey] = list
          
          if (tableKey === 'roadmaps') {
            db.projects = (db.projects || []).filter((p: any) => p.roadmapId !== args.where.id)
            db.tasks = (db.tasks || []).filter((t: any) => t.roadmapId !== args.where.id)
            db.reminders = (db.reminders || []).filter((r: any) => r.roadmapId !== args.where.id)
          }
          saveDB(db)
          return removed
        }
        return {}
      }
    }
  }

  return new Proxy({}, {
    get: (_, prop) => {
      if (typeof prop === 'string') {
        return createModelProxy(prop)
      }
      return undefined
    }
  })
}

let prismaClientInstance: any

export const hasDB = !!(process.env.DATABASE_URL && 
              process.env.DATABASE_URL.trim() !== "" && 
              !process.env.DATABASE_URL.includes("postgresql://your") &&
              !process.env.DATABASE_URL.includes("mock"))

if (hasDB) {
  try {
    const { PrismaClient } = require('@prisma/client')
    prismaClientInstance = new PrismaClient()
  } catch (e) {
    console.warn("[AI Studio] PrismaClient loading failed, falling back to JSON db mock")
    prismaClientInstance = createMockPrisma()
  }
} else {
  console.warn("[AI Studio] DATABASE_URL is not set or empty. Falling back to JSON db mock.")
  prismaClientInstance = createMockPrisma()
}

export const prisma = prismaClientInstance
