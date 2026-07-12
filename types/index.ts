/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

export type TechType = 'sql'|'python'|'bi'|'ai'|'git'|'js'|'other'
export interface TechItem { name: string; type: TechType }
export interface Resource { name: string; url: string }
