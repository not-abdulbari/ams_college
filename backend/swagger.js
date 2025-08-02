/** Swagger API documentation base config for backend */

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'College Management API',
      version: '1.0.0',
      description: 'API documentation for the College Management System',
    },
    servers: [
      {
        url: 'http://localhost:7000',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

module.exports = swaggerOptions;
