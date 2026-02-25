const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'Express + MongoDB task manager API with JWT cookie auth'
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } }
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        TaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'] }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

// Add explicit paths for the main endpoints so Swagger UI always shows them
const spec = swaggerJsdoc(options);

spec.paths = spec.paths || {};

// Auth endpoints
spec.paths['/api/auth/register'] = {
  post: {
    tags: ['Auth'],
    summary: 'Register new user',
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
    responses: {
      '201': { description: 'User created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } } } },
      '409': { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
};

spec.paths['/api/auth/login'] = {
  post: {
    tags: ['Auth'],
    summary: 'Login user',
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
    responses: {
      '200': { description: 'Logged in', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } } } },
      '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
};

spec.paths['/api/auth/logout'] = {
  post: {
    tags: ['Auth'],
    summary: 'Logout user (clear cookie)',
    responses: { '200': { description: 'Logged out' } }
  }
};

spec.paths['/api/auth/me'] = {
  get: {
    tags: ['Auth'],
    summary: 'Get current authenticated user',
    security: [{ cookieAuth: [] }],
    responses: {
      '200': { description: 'Current user', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } } } },
      '401': { description: 'Unauthorized' }
    }
  }
};

spec.paths['/api/auth/forgot-password'] = {
  post: {
    tags: ['Auth'],
    summary: 'Request password reset email',
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } } },
    responses: { '200': { description: 'If account exists, email sent' } }
  }
};

spec.paths['/api/auth/reset-password'] = {
  post: {
    tags: ['Auth'],
    summary: 'Reset password using token',
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } } },
    responses: { '200': { description: 'Password reset successful' }, '400': { description: 'Invalid or expired token' } }
  }
};

// Tasks endpoints
spec.paths['/api/tasks'] = {
  get: {
    tags: ['Tasks'],
    summary: 'List tasks (paginated, filterable)',
    security: [{ cookieAuth: [] }],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
      { name: 'status', in: 'query', schema: { type: 'string' } },
      { name: 'search', in: 'query', schema: { type: 'string' } }
    ],
    responses: {
      '200': { description: 'List of tasks', content: { 'application/json': { schema: { type: 'object' } } } }
    }
  },
  post: {
    tags: ['Tasks'],
    summary: 'Create a task',
    security: [{ cookieAuth: [] }],
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } } },
    responses: { '201': { description: 'Task created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } } }
  }
};

spec.paths['/api/tasks/{id}'] = {
  get: {
    tags: ['Tasks'],
    summary: 'Get a single task',
    security: [{ cookieAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { '200': { description: 'Task found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } }, '404': { description: 'Not found' } }
  },
  patch: {
    tags: ['Tasks'],
    summary: 'Update a task',
    security: [{ cookieAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } } },
    responses: { '200': { description: 'Task updated' }, '404': { description: 'Not found' } }
  },
  delete: {
    tags: ['Tasks'],
    summary: 'Delete a task',
    security: [{ cookieAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { '204': { description: 'Deleted' }, '404': { description: 'Not found' } }
  }
};

module.exports = spec;
