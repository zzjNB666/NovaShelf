require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/uploads');
const repository = require('./models/repository');
const { fail } = require('./utils/response');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS 来源不被允许'));
  }
}));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    data: {
      status: 'ok',
      mode: repository.mode,
      time: new Date().toISOString()
    },
    message: 'Nova Shelf API is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((req, res) => {
  fail(res, 404, '接口不存在');
});

app.use((err, req, res, next) => {
  console.error(err);
  fail(res, err.status || 500, err.message || '服务器错误');
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Nova Shelf API running on http://localhost:${port}`);
    console.log(`Database mode: ${repository.mode}`);
  });
}

module.exports = app;
