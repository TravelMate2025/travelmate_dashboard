# TravelMate Dashboard Features

## Overview
`travelmate_dashboard` is the operations console for TravelMate. It connects the backend to the consumer web and mobile apps by providing booking oversight, support tooling, reporting, user administration, content controls, notifications, and role management.

## App Shell And Access
- Next.js App Router dashboard with a shared authenticated layout.
- Responsive sidebar navigation for desktop and mobile.
- Automatic session timeout after inactivity.
- Global auth wrapper, toast system, and top loader support.
- Login, logout, and cookie-backed session handling.

## Dashboard Home
- Operational overview with booking totals, revenue, user counts, recent activity, and messages.
- Time filtering for weekly, monthly, and yearly views.
- Booking activity chart split by booking type.
- Recent activity feed and message summary panel.
- Superadmin-aware data loading for broader metrics.

## Bookings Management
- Booking list with tabs for stays, flights, and airport taxis.
- Search, currency selection, date filtering, and status filtering.
- Pagination and CSV export.
- Booking detail pages for stays, flights, and transfers.
- Booking cancellation request flow and cancellation processing screen.
- Direct access to booking records for operational review.

## Users Management
- Registered users list with search and date filters.
- Active and deactivated account views.
- Soft-deleted users view.
- User detail lookup.
- Activate, deactivate, delete, and bulk-delete actions.
- CSV export for user records.

## CMS And Commercial Rules
- Service commission settings for travel products.
- Edit commission percentage per service.
- Information policies and legal content area.
- Role-aware editing so only approved roles can change commission data.

## Customer Support
- Support dashboard with stats and support workflow entry points.
- Ticket list, escalated ticket list, and ticket detail views.
- Ticket claim, resolve, and escalation actions.
- Ticket message threads with admin responses.
- Live chat inbox and individual chat session pages.
- FAQ management with add, edit, and delete flows.

## Notifications
- Notification inbox with read/unread filtering.
- Search, date filters, and pagination.
- Mark-as-read, mark-all-read, and delete actions.
- Bulk actions for selected notifications.
- WebSocket-backed live notification updates.

## Reports And Analytics
- Overview, booking trends, and revenue/bookings combination views.
- Date-range and period-based reporting for week, month, quarter, and year views.
- Summary metrics for users, bookings, and revenue growth.
- Charting for booking breakdowns and performance trends.
- Excel export for reporting data.

## Admin Roles
- Role management with permission-group assignment.
- Create, update, and delete roles.
- Invite members into roles.
- Revoke invites and assign/remove users from roles.
- Super admin invitation and transfer flows.

## Authentication And Invitations
- Admin login flow.
- Forgot-password, reset-password, OTP verification, and password creation flows.
- Email confirmation/reset-status screens.
- Invitation acceptance flow for newly invited admins.

## Supporting Infrastructure
- Axios-based API services split by domain.
- Auth context and cookie helpers for session persistence.
- Reusable hooks for bookings, users, chat, notifications, CMS, reports, auth, and roles.
- Shared UI primitives and feature-level composed widgets.

## Notable Implementation Notes
- The dashboard is an operations hub rather than a customer-facing app.
- Most screens are API-driven and designed to keep backend state visible to support, admin, and finance-facing workflows.
- The navigation currently focuses on the core operational domains: dashboard, users, bookings, CMS, support, notifications, reports, and admin roles.
