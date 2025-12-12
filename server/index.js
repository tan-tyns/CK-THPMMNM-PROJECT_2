// project_2/server/index.js (PHIÊN BẢN HOÀN CHỈNH ĐỂ DEPLOY LÊN RENDER)

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
// ✅ Đã sửa lỗi: Thêm fs module để sử dụng fs.existsSync
const fs = require('fs'); 

// 🛑 KHÔNG CẦN DÙNG TRÊN RENDER: Render tự động cung cấp biến môi trường
// (Chú thích/Xóa dòng này khi deploy)
// require('dotenv').config({ path: path.resolve(__dirname, '.env') }); 

const app = express();
// Đảm bảo PORT luôn lấy từ process.env.PORT do Render cung cấp
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());

// --- 1. KẾT NỐI DATABASE (MONGOOSE) ---
// MONGODB_URI phải được cài đặt trong Environment Variables trên Render
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/render_demo';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => {
        // Lỗi này xảy ra nếu MONGO_URI chưa được cấu hình đúng trên Render
        console.error('❌ MongoDB connection error:', err);
        // Tùy chọn: process.exit(1); để buộc ứng dụng thoát nếu không kết nối được DB
    });

// Định nghĩa Schema (Cấu trúc dữ liệu)
const TaskSchema = new mongoose.Schema({
    title: String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// --- 2. API ROUTES ---
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({ title: req.body.title });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// --- 3. CẤU HÌNH DEPLOY LÊN RENDER ---
// Phục vụ các file đã build của React
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// ✅ Đã sửa lỗi: Thay đổi từ app.get('*', ... thành app.get('/*', ...)
// Đây là tuyến đường catch-all (wildcard) cho phép React Router xử lý các tuyến đường
app.get('/*', (req, res) => { 
    // Đảm bảo rằng tệp index.html đã được tạo ra sau khi 'npm run build' thành công
    if (fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
        res.status(404).send("Frontend not built. Run 'npm run build' first.");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});