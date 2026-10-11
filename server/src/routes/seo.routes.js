import express from 'express'
import { requireAuth, requireTenantScope, requireRole } from '../middleware/auth.js'
import {
  listSEOProjects,
  createSEOProject,
  getSEOProjectById,
  updateSEOProject,
  deleteSEOProject,
  getSEODashboard,
  listSEOIssues,
  createSEOIssue,
  updateSEOIssue,
  convertIssueToTask,
  verifySEOIssueFix,
  runSEOAudit,
  listSEOPages,
  createSEOPage,
  updateSEOPage,
  listSEOKeywords,
  createSEOKeyword,
  updateSEOKeyword,
  deleteSEOKeyword,
  listSEOBacklinks,
  createSEOBacklink,
  listSEOCompetitors,
  createSEOCompetitor,
  listSEORecommendations,
  convertRecommendationToTask,
  listSEOReports,
  createSEOReport,
  exportSEOKeywordsCSV,
  exportSEOBacklinksCSV,
} from '../controllers/seo.controller.js'

const router = express.Router()

// Enforce auth and tenant scoping for all SEO routes
router.use(requireAuth)
router.use(requireTenantScope)

const AGENCY_ROLES = ['super_admin', 'agency_admin', 'admin', 'manager', 'account_manager']
const TEAM_ROLES = ['super_admin', 'agency_admin', 'admin', 'manager', 'account_manager', 'team_member']

// Dashboard
router.get('/dashboard', getSEODashboard)

// Projects
router.route('/projects')
  .get(listSEOProjects)
  .post(requireRole(...AGENCY_ROLES), createSEOProject)

router.route('/projects/:id')
  .get(getSEOProjectById)
  .patch(requireRole(...AGENCY_ROLES), updateSEOProject)
  .delete(requireRole('super_admin', 'agency_admin', 'admin'), deleteSEOProject)

router.post('/projects/:projectId/audit', requireRole(...AGENCY_ROLES), runSEOAudit)

// Issues
router.route('/issues')
  .get(listSEOIssues)
  .post(requireRole(...TEAM_ROLES), createSEOIssue)

router.patch('/issues/:id', requireRole(...TEAM_ROLES), updateSEOIssue)
router.post('/issues/:id/convert-task', requireRole(...TEAM_ROLES), convertIssueToTask)
router.post('/issues/:id/verify', requireRole(...TEAM_ROLES), verifySEOIssueFix)

// Pages
router.route('/pages')
  .get(listSEOPages)
  .post(requireRole(...TEAM_ROLES), createSEOPage)

router.patch('/pages/:id', requireRole(...TEAM_ROLES), updateSEOPage)

// Keywords
router.get('/keywords/export', exportSEOKeywordsCSV)

router.route('/keywords')
  .get(listSEOKeywords)
  .post(requireRole(...TEAM_ROLES), createSEOKeyword)

router.route('/keywords/:id')
  .patch(requireRole(...TEAM_ROLES), updateSEOKeyword)
  .delete(requireRole(...AGENCY_ROLES), deleteSEOKeyword)

// Backlinks
router.get('/backlinks/export', exportSEOBacklinksCSV)

router.route('/backlinks')
  .get(listSEOBacklinks)
  .post(requireRole(...TEAM_ROLES), createSEOBacklink)

// Competitors
router.route('/competitors')
  .get(listSEOCompetitors)
  .post(requireRole(...TEAM_ROLES), createSEOCompetitor)

// Recommendations
router.get('/recommendations', listSEORecommendations)
router.post('/recommendations/:id/convert-task', requireRole(...TEAM_ROLES), convertRecommendationToTask)

// Reports
router.route('/reports')
  .get(listSEOReports)
  .post(requireRole(...AGENCY_ROLES), createSEOReport)

export default router
