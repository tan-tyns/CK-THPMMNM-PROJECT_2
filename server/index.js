// project_2/server/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs'); // Module để kiểm tra file tồn tại

// 🛑 KHÔNG CẦN DÙNG TRÊN RENDER (Render tự cung cấp env)
// require('dotenv').config(); 

const app = express();
// Đảm bảo PORT luôn lấy từ process.env.PORT do Render cung cấp
const PORT = process.env.PORT || 5000; 

// Middleware
app.use(cors());
app.use(express.json());

// --- 1. KẾT NỐI DATABASE (MONGOOSE) ---
// MONGODB_URI cài đặt trong Environment Variables trên Render
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/render_demo';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });

// Định nghĩa Schema (Cấu trúc dữ liệu)
const TaskSchema = new mongoose.Schema({
    title: String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// --- 2. API ROUTES (CRUD ĐẦY ĐỦ) ---

// Lấy danh sách (GET)
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Thêm mới (POST)
app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({ title: req.body.title });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Cập nhật trạng thái hoàn thành (PUT)
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        task.completed = !task.completed; // Đảo ngược trạng thái
        await task.save();
        res.json(task);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Xóa task (DELETE)
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// --- 3. CẤU HÌNH DEPLOY LÊN RENDER ---
// Đường dẫn đến thư mục build của React (Vite tạo ra thư mục dist)
const clientBuildPath = path.join(__dirname, '../client/dist');

// Phục vụ file tĩnh (CSS, JS, Images...)
app.use(express.static(clientBuildPath));

// ✅ SỬA LỖI QUAN TRỌNG CHO EXPRESS/RENDER:
// Sử dụng Regex /(.*)/ để bắt tất cả các request không phải API
// Điều này giúp tránh lỗi "Missing parameter name" của thư viện path-to-regexp mới
app.get(/(.*)/, (req, res) => { 
    if (fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
        res.status(404).send("Frontend not built. Run 'npm run build' first.");
    }
});
//test merge
// --- 4. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});