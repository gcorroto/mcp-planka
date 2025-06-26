// Set environment variables for testing with mock data
process.env.PLANKA_BASE_URL = 'http://mock-planka-server.test';
process.env.PLANKA_AGENT_EMAIL = 'test@example.com';
process.env.PLANKA_AGENT_PASSWORD = 'test-password';
process.env.PLANKA_ADMIN_EMAIL = 'admin@example.com';
process.env.PLANKA_ADMIN_USERNAME = 'admin';

// Set test environment flag to indicate we're running in test mode
process.env.NODE_ENV = 'test';

console.log('🧪 Test environment configured with mock data'); 