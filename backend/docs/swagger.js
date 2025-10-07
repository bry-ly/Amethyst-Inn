// Swagger/OpenAPI documentation configuration
let specs, swaggerUi, swaggerUiOptions;

try {
  // Try to import swagger dependencies
  const swaggerJSDoc = await import('swagger-jsdoc');
  const swaggerUiExpress = await import('swagger-ui-express');
  
  // Swagger definition
  specs = swaggerJSDoc.default({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Amethyst Inn API',
        version: '1.0.0',
        description: 'API documentation for Amethyst Inn Management System',
      },
      servers: [
        {
          url: process.env.API_BASE_URL || 'http://localhost:5000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./routes/*.js', './controllers/*.js'], // paths to files containing OpenAPI definitions
  });

  swaggerUi = swaggerUiExpress.default;
  swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Amethyst Inn API Documentation',
  };
} catch (error) {
  console.warn('Swagger dependencies not found. API documentation will be disabled.');
  specs = null;
  swaggerUi = null;
  swaggerUiOptions = null;
}

export { specs, swaggerUi, swaggerUiOptions };