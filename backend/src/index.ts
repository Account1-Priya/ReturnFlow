import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 ReturnFlow Backend API listening on port ${PORT}`);
  console.log(`📖 Swagger API Documentation available at http://localhost:${PORT}/api/docs`);
  console.log(`🩺 Health check available at http://localhost:${PORT}/health\n`);
});

