// Set environment variables for testing
process.env.PLANKA_BASE_URL = 'http://localhost:3333';
process.env.PLANKA_AGENT_EMAIL = 'demo@demo.demo';
process.env.PLANKA_AGENT_PASSWORD = 'demo';
process.env.PLANKA_ADMIN_EMAIL = 'demo@demo.demo';
process.env.PLANKA_ADMIN_USERNAME = 'demo';

// Check if the server is running before tests start
const fetch = await import('node-fetch');

async function checkServerConnection() {
    try {
        const response = await fetch.default(`${process.env.PLANKA_BASE_URL}/api/users`);
        if (response.status === 401) {
            // 401 is expected for unauthenticated requests, which means the server is running

            return true;
        } else {
            console.error(`❌ Unexpected response from server: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Failed to connect to Planka server at ${process.env.PLANKA_BASE_URL}`);
        console.error('Please make sure the Planka server is running before running tests');
        console.error(error);
        process.exit(1); // Exit with error code
    }
}

// Run the check
await checkServerConnection(); 