/** Minimal OpenAPI 3 document for the Swagger UI at /api/docs. */
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ProcureAI — Procurement & Vendor Intelligence API',
    version: '1.0.0',
    description:
      'AI-powered procurement platform. Search once, compare suppliers, and get explainable AI recommendations. Phase 1 uses mock provider adapters.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': { post: { tags: ['Auth'], summary: 'Register a new user', security: [] } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Login, returns JWT', security: [] } },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Current user profile' } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout' } },
    '/categories': { get: { tags: ['Catalog'], summary: 'List categories' } },
    '/categories/{id}/suppliers': { get: { tags: ['Catalog'], summary: 'Suppliers for a category' } },
    '/suppliers': { get: { tags: ['Catalog'], summary: 'List all suppliers' } },
    '/suppliers/{id}': { patch: { tags: ['Catalog'], summary: 'Enable/disable a supplier' } },
    '/search': { post: { tags: ['Search'], summary: 'Search enabled suppliers in parallel; compare + recommend' } },
    '/recommendations': { post: { tags: ['Search'], summary: 'Run the AI decision engine over a result set' } },
    '/basket/optimize': {
      post: {
        tags: ['Basket'],
        summary: 'Split-cart optimization: optimal supplier per item to maximize savings',
      },
    },
    '/basket/history': { get: { tags: ['Basket'], summary: 'List optimized basket history' } },
    '/preferences': {
      get: { tags: ['Preferences'], summary: 'Get user preferences' },
      put: { tags: ['Preferences'], summary: 'Update preferences' },
    },
    '/weight-profiles': { get: { tags: ['Preferences'], summary: 'List AI weight profiles' } },
    '/history': { get: { tags: ['History'], summary: 'List search history' } },
    '/history/{id}': { delete: { tags: ['History'], summary: 'Delete a history entry' } },
    '/dashboard': { get: { tags: ['Dashboard'], summary: 'Dashboard widget summary' } },
    '/analytics/spend': { get: { tags: ['Dashboard'], summary: 'Monthly & category spend' } },
    '/analytics/savings': { get: { tags: ['Dashboard'], summary: 'Savings trend' } },
    '/insights': { get: { tags: ['Dashboard'], summary: 'AI-generated insights' } },
  },
};
