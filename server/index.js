// project_2/server/index.js (ĐÃ SỬA CHỮA)

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
// KHẮC PHỤC LỖI 1: THÊM fs module
const fs = require('fs'); 

// KHẮC PHỤC LỖI 2: Dòng này chỉ nên dùng khi phát triển cục bộ.
// Render sẽ cung cấp biến môi trường MONGODB_URI và PORT.
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
        // In lỗi chi tiết ra console để dễ gỡ lỗi hơn trên Render Logs
        console.error('❌ MongoDB connection error:', err);
        // Tùy chọn: Thoát ứng dụng nếu kết nối DB thất bại để tránh chạy ứng dụng không có DB
        // process.exit(1); 
    });

// Định nghĩa Schema (Cấu trúc dữ liệu)
const TaskSchema = new mongoose.Schema({
    title: String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// --- 2. API ROUTES ---
// Lấy tất cả tasks
app.get('/api/tasks', async (req, res) => {
    try {
        // Sắp xếp theo thứ tự mới tạo trước
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Thêm task mới
app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({ title: req.body.title });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// --- 3. CẤU HÌNH DEPLOY LÊN RENDER (QUAN TRỌNG) ---
// Phục vụ các file đã build của React
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Đối với bất kỳ request nào khác (SPA Routing), trả về file index.html
app.get('*', (req, res) => {
    // Chỉ gửi file này nếu nó tồn tại (sau khi client build)
    if (fs.existsSync(path.join(clientBuildPath, 'index.html'))) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
        res.status(404).send("Frontend not built. Run 'npm run build' first.");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});