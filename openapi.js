const response = (description, schema) => ({
  description,
  ...(schema && { content: { 'application/json': { schema } } })
});
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const data = (schema) => ({ type: 'object', properties: { success: { type: 'boolean' }, data: schema } });
const arrayData = (schema) => ({
  type: 'object',
  properties: { success: { type: 'boolean' }, count: { type: 'integer' }, data: { type: 'array', items: schema } }
});
const error = response('Request failed', ref('Error'));
const unauthorized = response('Missing or invalid bearer token', ref('Error'));
const forbidden = response('Insufficient role', ref('Error'));
const id = (name, description) => ({ name, in: 'path', required: true, description, schema: { type: 'string' } });
const body = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const secured = { security: [{ bearerAuth: [] }] };
const admin = { ...secured, description: 'Admin only.' };
const appointmentDate = { type: 'object', required: ['apptDate'], properties: { apptDate: { type: 'string', format: 'date-time' } } };
const hospitalId = id('hospitalId', 'Hospital ID');
const appointmentId = id('id', 'Appointment ID');
const hospitalPathId = id('id', 'Hospital ID');

module.exports = {
  openapi: '3.0.3',
  info: { title: 'VacQ API', version: '1.0.0', description: 'Hospital and appointment API. Users can have at most three appointments.' },
  servers: [{ url: '/' }],
  tags: [{ name: 'Auth' }, { name: 'Hospitals' }, { name: 'Appointments' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
      TokenResponse: { type: 'object', properties: { success: { type: 'boolean' }, token: { type: 'string' } } },
      Register: {
        type: 'object', required: ['name', 'email', 'password'],
        properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 }, tel: { type: 'string' } }
      },
      Login: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } },
      User: { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, tel: { type: 'string' }, role: { type: 'string', enum: ['user', 'admin'] }, createdAt: { type: 'string', format: 'date-time' } } },
      HospitalInput: {
        type: 'object', required: ['name', 'address', 'district', 'province', 'postalcode', 'region'],
        properties: { name: { type: 'string', maxLength: 50 }, address: { type: 'string' }, district: { type: 'string' }, province: { type: 'string' }, postalcode: { type: 'string', maxLength: 5 }, tel: { type: 'string' }, region: { type: 'string' } }
      },
      Hospital: { allOf: [ref('HospitalInput'), { type: 'object', properties: { _id: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] },
      Appointment: { type: 'object', properties: { _id: { type: 'string' }, apptDate: { type: 'string', format: 'date-time' }, user: { type: 'string' }, hospital: { oneOf: [{ type: 'string' }, ref('Hospital')] }, createdAt: { type: 'string', format: 'date-time' } } }
    }
  },
  paths: {
    '/api/v1/auth/register': { post: { tags: ['Auth'], summary: 'Register a user', requestBody: body(ref('Register')), responses: { 200: response('Registered', ref('TokenResponse')), 400: error } } },
    '/api/v1/auth/login': { post: { tags: ['Auth'], summary: 'Log in', requestBody: body(ref('Login')), responses: { 200: response('Logged in', ref('TokenResponse')), 400: error, 401: error } } },
    '/api/v1/auth/me': { get: { tags: ['Auth'], summary: 'Get current user', ...secured, responses: { 200: response('Current user', data(ref('User'))), 401: unauthorized } } },
    '/api/v1/auth/logout': { get: { tags: ['Auth'], summary: 'Clear token cookie', description: 'Clears the cookie. An existing bearer JWT remains valid until expiry.', responses: { 200: response('Cookie cleared', data({ type: 'object' })) } } },
    '/api/v1/hospitals': {
      get: { tags: ['Hospitals'], summary: 'List hospitals', parameters: [
        ...['select', 'sort', 'page', 'limit'].map((name) => ({ name, in: 'query', schema: { type: ['page', 'limit'].includes(name) ? 'integer' : 'string' } }))
      ], responses: { 200: response('Hospitals with pagination', { allOf: [arrayData(ref('Hospital')), { type: 'object', properties: { pagination: { type: 'object' } } }] }), 400: error } },
      post: { tags: ['Hospitals'], summary: 'Create hospital', ...admin, requestBody: body(ref('HospitalInput')), responses: { 201: response('Created', data(ref('Hospital'))), 400: error, 401: unauthorized, 403: forbidden } }
    },
    '/api/v1/hospitals/{id}': {
      parameters: [hospitalPathId],
      get: { tags: ['Hospitals'], summary: 'Get hospital', responses: { 200: response('Hospital', data(ref('Hospital'))), 400: error } },
      put: { tags: ['Hospitals'], summary: 'Update hospital', ...admin, requestBody: body(ref('HospitalInput')), responses: { 200: response('Updated', data(ref('Hospital'))), 400: error, 401: unauthorized, 403: forbidden } },
      delete: { tags: ['Hospitals'], summary: 'Delete hospital and its appointments', ...admin, responses: { 200: response('Deleted', data({ type: 'object' })), 400: error, 401: unauthorized, 403: forbidden, 404: error } }
    },
    '/api/v1/appointments': {
      get: { tags: ['Appointments'], summary: 'List appointments', description: 'Admins see all appointments; users see their own.', ...secured, responses: { 200: response('Appointments', arrayData(ref('Appointment'))), 401: unauthorized, 500: error } }
    },
    '/api/v1/appointments/{id}': {
      parameters: [appointmentId],
      get: { tags: ['Appointments'], summary: 'Get appointment', ...secured, responses: { 200: response('Appointment', data(ref('Appointment'))), 401: unauthorized, 404: error, 500: error } },
      put: { tags: ['Appointments'], summary: 'Change appointment date', ...secured, requestBody: body(appointmentDate), responses: { 200: response('Updated', data(ref('Appointment'))), 400: error, 401: unauthorized, 404: error } },
      delete: { tags: ['Appointments'], summary: 'Delete appointment', ...secured, responses: { 200: response('Deleted', data({ type: 'object' })), 401: unauthorized, 404: error, 500: error } }
    },
    '/api/v1/hospitals/{hospitalId}/appointments': {
      parameters: [hospitalId],
      get: { tags: ['Appointments'], summary: 'List appointments at a hospital', ...secured, responses: { 200: response('Appointments', arrayData(ref('Appointment'))), 401: unauthorized, 500: error } },
      post: { tags: ['Appointments'], summary: 'Book an appointment', ...secured, requestBody: body(appointmentDate), responses: { 201: response('Created', data(ref('Appointment'))), 400: error, 401: unauthorized, 404: error } }
    }
  }
};
