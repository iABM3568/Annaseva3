// This import MUST be first: it reads .env into process.env
// before any other file tries to use those values.
import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

// Use the PORT from the environment (hosts like Render set it), otherwise 5000.
const PORT = process.env.PORT || 5000;

await connectDB(); // "await" works at the top level in ES modules

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
