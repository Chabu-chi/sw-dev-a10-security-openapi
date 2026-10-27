const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const openapi = require('./openapi');

dotenv.config({ path: './config/config.env' });

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set('query parser', 'extended');

app.use(mongoSanitize());
app.use(helmet({
  contentSecurityPolicy: {
    directives: { upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null }
  }
}));
app.use(xss());
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 100 }));
app.use(hpp());
app.use(cors());

const swaggerDocs = swaggerJsdoc({
  definition: {
    ...openapi,
    openapi: '3.0.0',
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }]
  },
  apis: [path.join(__dirname, 'routes', '*.js')]
});
app.get('/openapi.json', (req, res) => res.json(swaggerDocs));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/v1/hospitals', require('./routes/hospitals'));
app.use('/api/v1/appointments', require('./routes/appointments'));
app.use('/api/v1/auth', require('./routes/auth'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
      console.error(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) start();

module.exports = app;
