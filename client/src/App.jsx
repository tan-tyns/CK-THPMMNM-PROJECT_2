// client/src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Lấy dữ liệu khi load trang
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Thêm Task
  const addTask = async (e) => {
    e.preventDefault(); // Ngăn load lại trang
    if (!input.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input })
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setInput("");
    } catch (error) {
      console.error("Lỗi thêm:", error);
    }
  };

  // 3. Xóa Task
  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t._id !== id));
    } catch (error) {
      console.error("Lỗi xóa:", error);
    }
  };

  // 4. Toggle Hoàn thành
  const toggleTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'PUT' });
      const updatedTask = await res.json();
      
      setTasks(tasks.map(t => 
        t._id === id ? updatedTask : t
      ));
    } catch (error) {
      console.error("Lỗi update:", error);
    }
  };

  return (
    <div className="container">
      <div className="todo-app">
        <h1>📝 Quản Lý Công Việc</h1>
        <p className="subtitle">Dữ liệu được lưu trực tiếp vào MongoDB</p>

        {/* Form nhập liệu */}
        <form onSubmit={addTask} className="input-group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hôm nay bạn cần làm gì?" 
          />
          <button type="submit">Thêm</button>
        </form>

        {/* Danh sách công việc */}
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <ul className="task-list">
            {tasks.length === 0 && <li className="empty-msg">Chưa có công việc nào!</li>}
            
            {tasks.map(task => (
              <li key={task._id} className={task.completed ? "completed" : ""}>
                <span onClick={() => toggleTask(task._id)}>
                  {task.title}
                </span>
                <button 
                  className="delete-btn" 
                  onClick={() => deleteTask(task._id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;