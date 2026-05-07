# ClientFlow CRM — Product Requirements Document (PRD)

**Version:** 1.0  
**Type:** Final Year Project (FYP)  
**Stack:** Next.js · Supabase (Auth, DB, Realtime, Storage) · Tailwind CSS · Gemini AI  
**Prepared for:** Developer & Designer Handoff

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [User Roles & Access Matrix](#3-user-roles--access-matrix)
4. [Design System](#4-design-system)
5. [Information Architecture](#5-information-architecture)
6. [Feature Specifications](#6-feature-specifications)
7. [Database Schema (Supabase)](#7-database-schema-supabase)
8. [Realtime & Integration Architecture](#8-realtime--integration-architecture)
9. [AI Assistant Specification](#9-ai-assistant-specification)
10. [Additional Features (Enhancements)](#10-additional-features-enhancements)
11. [Implementation Batches](#11-implementation-batches)
12. [Acceptance Criteria](#12-acceptance-criteria)

---

## 1. Product Overview

**ClientFlow** is a niche CRM built exclusively for solo freelancers and boutique agency owners who actively hunt for clients. It replaces the scattered combination of spreadsheets, email threads, and file-sharing tools with one unified workspace per client relationship.

### Core Value Proposition

| Problem | ClientFlow Solution |
|---|---|
| Client data scattered across tools | Single wizard-based onboarding form per client |
| No structured handoff process | Accept/reject request flow that auto-creates a workspace |
| Manual proposals & invoices | One-click generation from collected project data |
| Client has no visibility | Dedicated client portal with live project tracking |
| No team collaboration on client work | Multi-member workspace with role-based access |

---

## 2. Goals & Non-Goals

### Goals

- Allow freelancers/agencies to manage multiple clients from one dashboard.
- Let clients self-onboard, submit project data via a guided wizard form, and track progress.
- Auto-create a shared workspace upon request acceptance with realtime sync via Supabase.
- Provide document generation: proposals, invoices, and contracts from collected data.
- Include a Gemini-powered AI assistant in both portals.
- Support multi-member collaboration within a client workspace.

### Non-Goals (Out of Scope for FYP)

- Native mobile app (responsive web only).
- Payment gateway integration (invoices are for generation only).
- Multi-language support.
- Public marketplace/listing of freelancers.

---

## 3. User Roles & Access Matrix

### 3.1 Role Definitions

| Role | Description |
|---|---|
| **Admin** | Platform owner. Manages all users, freelancers, clients, and system settings. |
| **Freelancer / Agency Owner** | Creates referral codes, receives client requests, manages workspaces, generates documents. |
| **Workspace Member** | Developer or team member added to a specific client project by the freelancer. |
| **Client** | Signs up, uses referral code to link with a freelancer, submits project data, tracks progress. |

### 3.2 Access Matrix

| Feature | Admin | Freelancer | Member | Client |
|---|---|---|---|---|
| Admin dashboard | ✅ | ❌ | ❌ | ❌ |
| View all users | ✅ | ❌ | ❌ | ❌ |
| Generate referral code | ❌ | ✅ | ❌ | ❌ |
| Enter referral code | ❌ | ❌ | ❌ | ✅ |
| Submit project wizard | ❌ | ❌ | ❌ | ✅ |
| Accept/reject request | ❌ | ✅ | ❌ | ❌ |
| Create workspace | Auto | Auto | ❌ | ❌ |
| View workspace | ❌ | ✅ | ✅ | ✅ (own) |
| Generate proposal/invoice/contract | ❌ | ✅ | ❌ | ❌ |
| Manage to-do list | ❌ | ✅ | ✅ | View only |
| Use AI assistant | ❌ | ✅ | ✅ | ✅ |
| Chat in workspace | ❌ | ✅ | ✅ | ✅ |
| Download client assets | ❌ | ✅ | ✅ | ❌ |

---

## 4. Design System

### 4.1 Color Palette

```
Primary:       #6366F1  (Indigo 500) — CTAs, active states, links
Primary Dark:  #4F46E5  (Indigo 600) — Hover states
Accent:        #8B5CF6  (Violet 500) — Badges, AI elements, gradients
Success:       #10B981  (Emerald 500) — Status: active, accepted
Warning:       #F59E0B  (Amber 500) — Status: pending, draft
Danger:        #EF4444  (Red 500) — Status: rejected, delete
Neutral 900:   #111827  — Primary text
Neutral 600:   #4B5563  — Secondary text
Neutral 200:   #E5E7EB  — Borders, dividers
Neutral 50:    #F9FAFB  — Page background
Surface:       #FFFFFF  — Cards, modals, panels
```

### 4.2 Typography

```
Font Family:   Inter (Google Fonts)
Display:       32px / 700 — Page titles
Heading 1:     24px / 600 — Section headers
Heading 2:     18px / 600 — Card titles
Body:          14px / 400 — General text
Body Small:    12px / 400 — Labels, captions
Code:          13px / 400 — Fira Code — code snippets
```

### 4.3 Iconography

```
Library:       Lucide React (consistent, clean line icons)
Size default:  20px stroke-width: 1.5
Style:         Outlined only — no filled icons
```

**Key icons to use:**

| Element | Icon |
|---|---|
| Workspace | `layout-dashboard` |
| Client | `users` |
| Proposal | `file-text` |
| Invoice | `receipt` |
| Contract | `file-signature` (or `clipboard-check`) |
| To-Do | `check-square` |
| Chat | `message-square` |
| AI Assistant | `sparkles` |
| Upload | `upload-cloud` |
| Referral | `link-2` |
| Settings | `settings` |
| Notifications | `bell` |
| Download | `download` |
| Add Member | `user-plus` |

### 4.4 Spacing Scale (Tailwind)

```
xs: 4px (p-1)    sm: 8px (p-2)    md: 16px (p-4)
lg: 24px (p-6)   xl: 32px (p-8)   2xl: 48px (p-12)
```

### 4.5 Component Tokens

```
Border Radius:   rounded-xl (12px) for cards
                 rounded-lg (8px) for buttons/inputs
                 rounded-full for avatars and badges
Shadow:          shadow-sm for cards (default)
                 shadow-md for modals and dropdowns
Card:            bg-white border border-neutral-200 rounded-xl p-6
Input:           border border-neutral-200 rounded-lg px-3 py-2 text-sm
                 focus:ring-2 ring-indigo-500 outline-none
Button Primary:  bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2
Button Ghost:    border border-neutral-200 hover:bg-neutral-50 rounded-lg px-4 py-2
```

### 4.6 Layout Patterns

**Sidebar layout** (freelancer & admin portals): Fixed left sidebar (240px) + scrollable main content.  
**Top-bar layout** (client portal): Horizontal nav with user avatar and notification bell.  
**Wizard layout** (project form): Full-screen centered step flow with progress bar.

---

## 5. Information Architecture

```
ClientFlow
├── /auth
│   ├── /login               — Shared login (role-based redirect)
│   ├── /signup/freelancer   — Freelancer registration
│   └── /signup/client       — Client registration
│
├── /freelancer              — Freelancer Portal
│   ├── /dashboard           — Overview: requests, workspaces, revenue
│   ├── /requests            — Incoming client requests (accept/reject)
│   ├── /workspaces
│   │   └── /[workspace_id]
│   │       ├── /overview    — Project summary
│   │       ├── /assets      — Downloadable files from client
│   │       ├── /documents   — Proposals, invoices, contracts
│   │       ├── /todos       — To-do list
│   │       ├── /chat        — Feedback chat
│   │       └── /members     — Manage team members
│   ├── /clients             — All linked clients
│   ├── /referrals           — Referral code generation & analytics
│   ├── /pipeline            — Client pipeline (Kanban view)
│   ├── /ai-assistant        — Gemini AI chat
│   └── /settings            — Profile, integrations
│
├── /client                  — Client Portal
│   ├── /dashboard           — Status, active workspace, notifications
│   ├── /link                — Enter referral code to link with freelancer
│   ├── /onboarding          — Project wizard form (multi-step)
│   ├── /workspace/[id]
│   │   ├── /overview        — Project status tracker
│   │   ├── /documents       — View proposals, invoices, contracts
│   │   ├── /todos           — View to-do list
│   │   └── /chat            — Feedback chat
│   ├── /ai-assistant        — Gemini AI chat
│   └── /settings            — Profile settings
│
└── /admin                   — Admin Portal
    ├── /dashboard           — Platform metrics
    ├── /users               — All users management
    ├── /freelancers         — Freelancer management
    ├── /clients             — Client management
    ├── /workspaces          — All workspaces overview
    └── /settings            — Platform settings
```

---

## 6. Feature Specifications

### 6.1 Authentication & Onboarding

**Flow:**

1. User lands on `/auth/signup` and selects role (Freelancer or Client).
2. Supabase Auth handles email/password registration.
3. After verification, user is redirected to their respective portal.
4. On first login, a profile setup screen is shown (name, avatar, bio).

**Client-specific onboarding:**

After signup, the client sees a "Link Your Freelancer" screen where they enter the referral code. This creates a `client_freelancer_link` record and marks their workspace as pending until they submit the project form.

---

### 6.2 Referral Code System

**Freelancer side:**

- Freelancer generates a unique referral code from `/freelancer/referrals`.
- Code is alphanumeric, 8 characters (e.g., `FL-X9K2MQ`).
- One code per freelancer (or optionally per campaign).
- Dashboard shows: total uses, linked clients, conversion rate.

**Client side:**

- Client enters code on their dashboard.
- System validates and links the client to the freelancer.
- Confirmation message: "You are now linked to [Freelancer Name]. Please complete your project form to get started."

**Supabase implementation:** `referral_codes` table with `freelancer_id`, `code`, `max_uses`, `use_count`.

---

### 6.3 Project Wizard Form (Client Portal)

Multi-step form with progress indicator (step X of N). Each step is validated before proceeding.

**Step 1 — Project Basics**

- Project name (text)
- Project type (dropdown: Website, Mobile App, E-commerce, Branding, Other)
- Brief description (textarea)
- Project budget range (select)
- Estimated timeline (date range picker)

**Step 2 — Business Information**

- Business name
- Industry
- Target audience description
- Competitor references (up to 3 URLs)
- Social media links

**Step 3 — Branding & Assets**

- Logo upload (PNG/SVG, max 10MB)
- Brand color palette (color picker, up to 5)
- Brand fonts (text input or upload)
- Reference images or mood board (multi-upload, max 20 files, 50MB total)
- Additional documents (PDF, DOCX)

**Step 4 — Technical Requirements**

- Platform preferences (checkboxes: Web, iOS, Android)
- Specific technology preferences (optional text)
- Existing tools/integrations to connect
- Special requirements (textarea)

**Step 5 — Review & Submit**

- Summary of all entries
- Checkbox: "I confirm all information is accurate"
- Submit button → sends request to freelancer in realtime

**Storage:** Files go to Supabase Storage bucket `project-assets/{workspace_id}/`.

---

### 6.4 Request System (Realtime)

**Client submits form → Freelancer receives notification.**

Technical flow:

1. Form submission creates a record in `project_requests` table.
2. Supabase Realtime broadcasts to the freelancer's channel.
3. Freelancer sees a notification badge + entry in `/freelancer/requests`.
4. Request card shows: client name, project type, budget, timeline, submitted date.
5. Freelancer can preview all submitted data and assets before deciding.

**Actions:**

- **Accept** → triggers workspace creation (see 6.5).
- **Reject** → client is notified with an optional message. Status becomes `rejected`.
- **Request Info** → sends a chat message to the client asking for clarification. Status becomes `info_needed`.

---

### 6.5 Workspace (Auto-Created on Accept)

When a freelancer accepts a request:

1. A `workspaces` record is created with status `active`.
2. All form data and assets are copied/linked into the workspace.
3. Client receives a realtime notification and email: "Your workspace is ready."
4. Both freelancer and client now see the workspace in their dashboards.

**Workspace tabs:**

**Overview tab:**

- Project name, type, status badge.
- Key dates: start date, estimated delivery.
- Progress tracker (visual step indicator: Briefing → Proposal → In Progress → Review → Complete).
- Quick stats: open to-dos, unread messages.

**Assets tab:**

- All files uploaded by the client, organized by type.
- Download individual files or download all as ZIP.
- Freelancer can upload additional files for the client.

**Documents tab:**

- Proposal, Invoice, Contract sub-sections.
- Each has a "Generate" button (see 6.6).
- Generated documents show status: Draft / Sent / Signed / Paid.

**To-Do tab:**

- Full to-do list (see 6.7).

**Chat tab:**

- Feedback chat (see 6.8).

**Members tab:**

- Add/remove workspace members by email.
- Set role: Editor or Viewer.

---

### 6.6 Document Generation

Freelancer triggers generation from the Documents tab. The generator uses the data from the project wizard form pre-populated into templates.

**Proposal:**

- Introduction (freelancer bio, auto-filled)
- Project understanding (from client's description)
- Scope of work (editable list)
- Timeline breakdown (editable table)
- Pricing (editable line items)
- Terms (default template, editable)
- CTA: "Accept Proposal" button for the client

**Invoice:**

- Invoice number (auto-incremented)
- Bill to: client details
- Line items with quantities and rates
- Subtotal, tax (optional), total
- Payment terms and due date
- Status: Unpaid / Partially Paid / Paid (manual toggle)

**Contract:**

- Party details (auto-filled)
- Project scope (from proposal if exists)
- Payment schedule
- Revision policy
- Confidentiality clause (default)
- Termination clause (default)
- Signature fields (client + freelancer name + date — digital acknowledgement)

**Delivery:** Generated as PDF. Sent to client via realtime notification and visible in client's Documents tab.

---

### 6.7 To-Do List

Collaborative task list within each workspace.

**Features:**

- Add tasks with title, description, due date, priority (Low / Medium / High), and assignee (from workspace members).
- Drag-and-drop reordering.
- Mark as complete (strikethrough animation).
- Filter by: assignee, priority, status.
- Client can view all tasks but cannot add or edit — only comment on individual tasks.
- Completed tasks collapse into a "Completed" section.

**Supabase Realtime:** Any change by freelancer or member is reflected instantly for all workspace participants.

---

### 6.8 Chat System

Per-workspace messaging between freelancer, members, and client.

**Features:**

- Text messages with markdown support (bold, italic, code blocks).
- File attachments (images, PDFs — max 10MB each).
- Message reactions (emoji, limited to 6 common emojis).
- Reply to specific message (threaded reply preview).
- Unread message badge on workspace cards.
- Typing indicator.
- Timestamps (relative: "2 min ago"; absolute on hover).
- Message search within workspace.

**Realtime:** Powered by Supabase Realtime on `workspace_messages` table.

---

### 6.9 Pipeline View (Freelancer Only)

Kanban-style board showing all clients across stages.

**Columns:**

1. Lead (referral code sent but client not yet linked)
2. Onboarding (client linked, form not yet submitted)
3. Proposal Sent
4. In Progress
5. Review
6. Completed
7. Churned

**Card shows:** Client name, project type, days in stage, avatar.

**Actions per card:** Move to next stage, open workspace, archive.

---

### 6.10 Notifications System

**In-app notifications** (bell icon, top nav):

- New client request received
- Client submitted project form
- Document viewed/signed by client
- New chat message
- To-do assigned to me
- Workspace member joined
- AI suggestion ready

**Email notifications** (Supabase + Resend or SendGrid):

- Workspace created
- Proposal/Invoice/Contract received (client)
- Request accepted/rejected (client)

All notifications stored in `notifications` table with `read` boolean and `type` enum.

---

### 6.11 Admin Portal

**Dashboard metrics:**

- Total freelancers, total clients, total workspaces
- Active workspaces this month
- New signups (chart, last 30 days)
- Requests accepted vs rejected (pie chart)

**User management:**

- List all users with search and filter by role.
- View profile, disable/enable account, delete.
- Impersonate user (view as that user — read only).

**Platform settings:**

- Default contract/proposal templates.
- Email template configuration.
- Feature flag toggles (enable/disable AI assistant, referral system).

---

## 7. Database Schema (Supabase)

### Core Tables

```sql
-- Users (extends Supabase auth.users)
profiles (
  id uuid PRIMARY KEY references auth.users,
  role text CHECK (role IN ('admin','freelancer','member','client')),
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
)

-- Referral codes
referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid references profiles(id),
  code text UNIQUE NOT NULL,
  max_uses int DEFAULT 100,
  use_count int DEFAULT 0,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- Client <> Freelancer link
client_freelancer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid references profiles(id),
  freelancer_id uuid references profiles(id),
  referral_code_id uuid references referral_codes(id),
  status text CHECK (status IN ('pending','active','archived')),
  created_at timestamptz DEFAULT now()
)

-- Project requests
project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid references profiles(id),
  freelancer_id uuid references profiles(id),
  link_id uuid references client_freelancer_links(id),
  status text CHECK (status IN ('pending','accepted','rejected','info_needed')),
  form_data jsonb,  -- stores all wizard form responses
  submitted_at timestamptz DEFAULT now(),
  responded_at timestamptz
)

-- Workspaces
workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid references project_requests(id),
  client_id uuid references profiles(id),
  freelancer_id uuid references profiles(id),
  name text NOT NULL,
  project_type text,
  status text CHECK (status IN ('active','review','completed','archived')),
  pipeline_stage text,
  created_at timestamptz DEFAULT now()
)

-- Workspace members
workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid references workspaces(id) ON DELETE CASCADE,
  user_id uuid references profiles(id),
  role text CHECK (role IN ('editor','viewer')),
  invited_by uuid references profiles(id),
  joined_at timestamptz DEFAULT now()
)

-- Assets
workspace_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid references workspaces(id) ON DELETE CASCADE,
  uploaded_by uuid references profiles(id),
  file_name text,
  file_type text,
  file_size bigint,
  storage_path text,
  category text CHECK (category IN ('logo','branding','reference','document','other')),
  uploaded_at timestamptz DEFAULT now()
)

-- Documents (proposals, invoices, contracts)
workspace_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid references workspaces(id) ON DELETE CASCADE,
  type text CHECK (type IN ('proposal','invoice','contract')),
  status text CHECK (status IN ('draft','sent','viewed','signed','paid')),
  content jsonb,
  pdf_path text,
  created_by uuid references profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- To-dos
workspace_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid references workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid references profiles(id),
  priority text CHECK (priority IN ('low','medium','high')),
  is_complete bool DEFAULT false,
  due_date date,
  sort_order int DEFAULT 0,
  created_by uuid references profiles(id),
  created_at timestamptz DEFAULT now()
)

-- Chat messages
workspace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid references workspaces(id) ON DELETE CASCADE,
  sender_id uuid references profiles(id),
  content text,
  reply_to_id uuid references workspace_messages(id),
  attachments jsonb,
  created_at timestamptz DEFAULT now()
)

-- Notifications
notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles(id),
  type text NOT NULL,
  title text,
  body text,
  data jsonb,
  is_read bool DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- AI conversations
ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles(id),
  workspace_id uuid references workspaces(id),
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### Row Level Security (RLS) Summary

- `profiles`: User can only read/update their own profile. Admin reads all.
- `workspaces`: Freelancer, client, and members of that workspace can access. Admin reads all.
- `workspace_messages`: Only workspace participants can read/insert.
- `workspace_documents`: Client can only read (not create/edit).
- `workspace_todos`: Client can read only. Members and freelancer can CRUD.
- `notifications`: User can only see their own.

---

## 8. Realtime & Integration Architecture

### Supabase Realtime Channels

| Channel | Trigger | Listeners |
|---|---|---|
| `requests:{freelancer_id}` | New row in `project_requests` | Freelancer portal |
| `workspace:{workspace_id}` | Any change in workspace tables | All workspace members |
| `notifications:{user_id}` | New row in `notifications` | All portals |
| `messages:{workspace_id}` | New row in `workspace_messages` | Chat component |
| `todos:{workspace_id}` | Any change in `workspace_todos` | To-do component |

### File Storage (Supabase Storage)

```
Buckets:
  project-assets/
    {workspace_id}/
      logos/
      branding/
      references/
      documents/
  
  generated-docs/
    {workspace_id}/
      proposals/
      invoices/
      contracts/
  
  avatars/
    {user_id}/
```

### Email (Resend or Supabase built-in SMTP)

Triggered via Supabase Edge Functions or server actions:

- `onWorkspaceCreated` → email client
- `onDocumentSent` → email client
- `onRequestStatusChanged` → email client
- `onNewMessage` → digest email (if user inactive for 30 min)

---

## 9. AI Assistant Specification

**Provider:** Google Gemini API (gemini-1.5-flash for speed, gemini-1.5-pro for complex tasks)

### Freelancer AI Assistant

Accessible from sidebar and within workspace context.

**Capabilities:**

- Draft proposal copy from project brief ("Write a proposal introduction for a Shopify store project for a fashion brand.")
- Suggest pricing based on project type and scope.
- Generate contract clauses on demand.
- Summarize client chat conversations.
- Draft follow-up messages to unresponsive clients.
- Analyze to-do list and suggest task breakdowns.
- Answer general freelancing business questions.

**Context injection:** The AI is given the current workspace's project summary, form data, and chat history (last 20 messages) as context when invoked within a workspace.

### Client AI Assistant

Accessible from client dashboard and within workspace.

**Capabilities:**

- Explain what a proposal/invoice/contract means in simple terms.
- Answer "What is the status of my project?"
- Help client write a better project brief before submitting.
- Clarify terms in the contract.
- Help draft feedback messages for the freelancer.

**Context injection:** Current workspace status, submitted form data, received documents.

### Technical Implementation

```javascript
// Edge Function: /functions/ai-chat
// Receives: { userId, workspaceId, messages, userRole }
// Injects workspace context from Supabase
// Calls Gemini API
// Stores conversation in ai_conversations table
// Returns: { reply: string }
```

---

## 10. Additional Features (Enhancements)

These are features beyond the original brief that add significant value:

### 10.1 Client Pipeline (Kanban)

Already specified in 6.9. Visualizes the entire client lifecycle.

### 10.2 Activity Log per Workspace

Every action in a workspace (file uploaded, document sent, todo completed, member added) is logged in a `workspace_activity` table and shown as a timeline in the Overview tab.

### 10.3 Proposal Acceptance Flow

When a client receives a proposal:

- "Accept Proposal" button in client portal.
- Client can add comments/counter-offer notes before accepting.
- Upon acceptance, workspace status advances to "In Progress" automatically.
- Freelancer is notified instantly.

### 10.4 Time Tracker (per Workspace)

- Freelancer and members can log hours against a workspace.
- Timer widget in workspace sidebar.
- Hours summary visible to freelancer for invoice generation.
- `time_logs` table: `workspace_id`, `user_id`, `hours`, `description`, `logged_at`.

### 10.5 Client Satisfaction Score

After project is marked Complete:

- Client receives a simple 5-star rating prompt + optional comment.
- Rating stored in `workspace_reviews`.
- Freelancer sees average rating on their dashboard.

### 10.6 Template Library

- Freelancer can save custom proposal, invoice, and contract templates.
- Stored in `document_templates` table.
- When generating a document, freelancer can pick from saved templates.

### 10.7 Quick Notes (Freelancer)

- Sticky note widget on freelancer dashboard for private notes about a client.
- Not visible to client.
- Stored in `freelancer_notes` table with `client_id` reference.

### 10.8 Client Tags & Segmentation

- Freelancer can tag clients: "High Value", "Retainer", "One-time", "VIP".
- Filter client list and pipeline by tag.

### 10.9 Deadline & Reminder System

- Freelancer sets milestones with deadlines in each workspace.
- 24-hour and 1-hour reminders sent via in-app notification.
- Milestones visible to client in Overview tab.

### 10.10 Referral Analytics

- Dashboard showing referral code performance: total shares, conversions, active clients.
- Option to create campaign-specific codes with labels.

---

## 11. Implementation Batches

Each batch must be completed, tested, and reviewed before the next begins. Do not proceed if there are broken flows.

---

### BATCH 1 — Foundation & Auth

**Goal:** Running project with all three portals accessible by correct roles.

**Tasks:**

1. Initialize Next.js 14 project with App Router, Tailwind CSS, Lucide React.
2. Configure Supabase project: enable Auth, set up email templates.
3. Create Supabase tables: `profiles`, `referral_codes`, `client_freelancer_links`.
4. Implement Supabase Auth with email/password.
5. Build `/auth/login` page — email, password, submit.
6. Build `/auth/signup` page — role selector (Freelancer / Client), name, email, password.
7. On signup, create `profiles` row via Supabase trigger or server action.
8. Implement role-based redirect after login:
   - admin → `/admin/dashboard`
   - freelancer → `/freelancer/dashboard`
   - client → `/client/dashboard`
9. Build shared layout components: Sidebar (freelancer/admin), TopBar (client), Logo.
10. Implement protected route middleware using Supabase session.
11. Build basic skeleton dashboard pages (placeholder content) for all three portals.
12. Apply Design System tokens: colors, fonts, border radius, shadows.

**Test checklist:**

- [ ] Freelancer can sign up and land on freelancer dashboard.
- [ ] Client can sign up and land on client dashboard.
- [ ] Unauthenticated user is redirected to login.
- [ ] Wrong role cannot access other portal (e.g., client cannot reach `/freelancer/...`).
- [ ] Design tokens applied correctly across all pages.

---

### BATCH 2 — Referral Code System

**Goal:** Freelancer generates a code. Client enters it. Link is created.

**Tasks:**

1. Build `/freelancer/referrals` page.
2. "Generate Code" button → creates record in `referral_codes` table.
3. Display code in a copy-to-clipboard card with usage stats.
4. Build "Link Your Freelancer" screen in client portal (shown after first login if not linked).
5. Input field + "Link" button → validate code against `referral_codes` → create `client_freelancer_links` record.
6. Show success message with freelancer name and avatar.
7. Update freelancer dashboard to show newly linked clients.

**Test checklist:**

- [ ] Freelancer generates code, code appears in DB.
- [ ] Client enters invalid code → shows error.
- [ ] Client enters valid code → link created → client sees freelancer name.
- [ ] Freelancer dashboard updates to show client link.

---

### BATCH 3 — Project Wizard Form (Client Portal)

**Goal:** Client completes and submits the multi-step project form.

**Tasks:**

1. Build wizard container with step progress bar and navigation (Next / Back / Submit).
2. Build Step 1: Project Basics (inputs, validation).
3. Build Step 2: Business Information (inputs, validation).
4. Build Step 3: Branding & Assets — file uploads to Supabase Storage.
5. Build Step 4: Technical Requirements (checkboxes, textarea).
6. Build Step 5: Review summary page.
7. On submit: create `project_requests` row with `form_data` as JSONB and `status: pending`.
8. Show "Request Submitted" confirmation screen with estimated response time.

**Test checklist:**

- [ ] Cannot proceed to next step without completing required fields.
- [ ] Files upload successfully to Supabase Storage.
- [ ] Form data saved correctly to `project_requests` as JSONB.
- [ ] Client sees confirmation screen after submission.
- [ ] Client cannot re-submit if a pending request already exists.

---

### BATCH 4 — Request Flow & Workspace Creation

**Goal:** Freelancer receives the request in realtime and accepts it, triggering workspace creation.

**Tasks:**

1. Build `/freelancer/requests` page showing all incoming requests.
2. Subscribe to `requests:{freelancer_id}` Supabase Realtime channel.
3. Show notification badge on sidebar when new request arrives.
4. Build request detail modal: client info, project summary, asset preview.
5. Implement Accept action:
   - Create `workspaces` row.
   - Create `workspace_members` row for freelancer.
   - Copy form data and asset paths into workspace.
   - Update `project_requests.status` to `accepted`.
   - Create `notifications` row for client.
6. Implement Reject action:
   - Update status to `rejected`.
   - Create notification for client with optional message.
7. Client portal: subscribe to `notifications:{client_id}` channel.
8. Client sees workspace appear in their dashboard after acceptance.

**Test checklist:**

- [ ] New request appears on freelancer portal in realtime (no page refresh).
- [ ] Accept creates workspace visible to both freelancer and client.
- [ ] Client receives realtime notification on acceptance.
- [ ] Rejected client sees rejection notice.
- [ ] Assets from form are accessible within the new workspace.

---

### BATCH 5 — Workspace Core (Assets, To-Do, Chat)

**Goal:** Workspace is functional with all core collaboration features.

**Tasks:**

1. Build workspace layout with tab navigation (Overview, Assets, Documents, To-Do, Chat, Members).
2. **Overview tab:** project status, pipeline stage badge, quick stats.
3. **Assets tab:** file grid view, download individual / download all ZIP.
4. **To-Do tab:**
   - List view with priority badges.
   - Add task form (title, due date, priority, assignee).
   - Complete toggle (realtime update for all members).
   - Client: read-only view.
5. **Chat tab:**
   - Message list with sender avatar and timestamp.
   - Input with file attachment support.
   - Subscribe to `messages:{workspace_id}` Realtime channel.
   - Typing indicator.
6. **Members tab:**
   - List current members with roles.
   - Invite by email → creates Supabase invite + `workspace_members` row.
   - Remove member option.
7. Activity log in Overview tab.

**Test checklist:**

- [ ] To-do added by freelancer appears instantly for client (no refresh).
- [ ] Chat message from client appears instantly for freelancer.
- [ ] File downloads work for assets tab.
- [ ] Client cannot add to-dos (add button hidden/disabled).
- [ ] Invited member can access workspace after accepting invite.

---

### BATCH 6 — Document Generation

**Goal:** Freelancer can generate, send, and manage proposals, invoices, and contracts.

**Tasks:**

1. Build Documents tab UI with three sub-sections.
2. Build Proposal editor:
   - Pre-fill from workspace project data.
   - Editable rich text sections.
   - Line item table for pricing.
3. Build Invoice editor:
   - Auto-generated invoice number.
   - Line items with quantity, rate, total.
   - Tax and total calculation.
4. Build Contract editor:
   - Pre-fill party details.
   - Standard clauses with editable text.
5. Implement PDF generation (use `react-pdf` or server-side `pdfmake`).
6. Upload generated PDF to Supabase Storage `generated-docs/`.
7. Save `workspace_documents` row with PDF path and status `sent`.
8. Send realtime notification to client on document send.
9. Client portal: Documents tab shows received documents with "View" button.
10. "Mark as Paid" toggle on invoice (status update only, no payment processing).

**Test checklist:**

- [ ] Proposal generates correctly with project data pre-filled.
- [ ] Invoice calculations are correct (quantity × rate, tax, total).
- [ ] PDF downloads are readable and well-formatted.
- [ ] Client receives notification and can view document.
- [ ] Document status updates correctly (Draft → Sent → Viewed).

---

### BATCH 7 — AI Assistant

**Goal:** Gemini-powered AI assistant working in both portals.

**Tasks:**

1. Set up Supabase Edge Function `ai-chat` to call Gemini API.
2. Inject workspace context (project data, status, last 20 messages) into prompt.
3. Build AI chat UI component (shared, reusable):
   - Message list with AI and user bubbles.
   - Input field with send button.
   - Loading skeleton while waiting for response.
   - "Thinking..." indicator.
4. Embed AI assistant as a floating drawer (triggered by `sparkles` icon in sidebar).
5. Freelancer-specific prompts: drafting, pricing, contract clauses.
6. Client-specific prompts: explaining documents, project status, feedback help.
7. Store conversation history in `ai_conversations` table.
8. Clear conversation button.

**Test checklist:**

- [ ] AI responds within 3 seconds on average.
- [ ] Context from current workspace is reflected in AI answers.
- [ ] Conversation persists if user closes and reopens the drawer.
- [ ] AI does not reveal one user's data to another.

---

### BATCH 8 — Admin Portal & Polish

**Goal:** Admin portal complete. All portals polished and production-ready.

**Tasks:**

1. Build admin dashboard with platform metrics.
2. Build user management table with search, filter, disable/enable.
3. Implement notification system (bell icon, dropdown list, mark all read).
4. Add pipeline Kanban view for freelancer.
5. Implement client satisfaction rating (post-completion prompt).
6. Add time tracker widget per workspace.
7. Global search (freelancer portal): search clients, workspaces, documents.
8. Responsive design pass: ensure all pages work on tablet and mobile.
9. Loading states and error boundaries on all async operations.
10. Toast notification system for all success/error feedback.
11. Dark mode support (optional but recommended — use Tailwind's `dark:` classes).
12. Final accessibility pass (focus states, aria labels, keyboard navigation).

**Test checklist:**

- [ ] Admin can view and manage all users.
- [ ] All loading states are handled (no blank screens on slow network).
- [ ] All error states show user-friendly messages.
- [ ] Pipeline Kanban drag-and-drop works correctly.
- [ ] Platform is usable on a 768px tablet viewport.

---

## 12. Acceptance Criteria

A feature is considered done when:

1. It works end-to-end (not just UI — database records created/updated correctly).
2. Supabase Realtime events fire and are received without page refresh.
3. RLS policies prevent unauthorized data access (test with a different user session).
4. The design matches the Design System (colors, fonts, spacing, icons).
5. No console errors in production build.
6. Loading and empty states are implemented.

---

## Appendix: Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | Custom + Shadcn/ui (select, dialog, tooltip) |
| Icons | Lucide React |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (WebSockets) |
| File Storage | Supabase Storage |
| AI | Google Gemini API (via Edge Function) |
| PDF Generation | pdfmake or react-pdf |
| Email | Resend (via Supabase Edge Function) |
| State Management | Zustand or React Context |
| Forms | React Hook Form + Zod validation |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

*Document prepared for developer and designer handoff. Each batch should result in a reviewed pull request before the next batch begins.*
