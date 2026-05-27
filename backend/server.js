const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Use environment variable for MongoDB connection in production
const mongoURI = process.env.MONGO_URI ||
    "mongodb+srv://KVAnh_db_user:20235257@cluster0.9mq6py0.mongodb.net/?appName=Cluster0";

mongoose
    .connect(mongoURI)
    .then(() => console.log("Đã kết nối tới MongoDB Atlas"))
    .catch((err) => console.error("Lỗi kết nối MongoDB Atlas:", err));

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: Number,
    address: String,
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);


app.post("/api/users", async (req, res) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({
            message: "Lỗi khi tạo người dùng",
            error: error.message,
        });
    }
});

app.get("/api/users", async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);
        const search = (req.query.search || "").trim();

        const filter = search
            ? {
                  $or: [
                      { name: { $regex: search, $options: "i" } },
                      { email: { $regex: search, $options: "i" } },
                  ],
              }
            : {};

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({
            data: users,
            page,
            limit,
            total,
            totalPages: Math.max(Math.ceil(total / limit), 1),
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi lấy danh sách",
            error: error.message,
        });
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        );
        if (!updatedUser)
            return res
                .status(404)
                .json({ message: "Không tìm thấy người dùng" });
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({
            message: "Lỗi khi cập nhật",
            error: error.message,
        });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser)
            return res
                .status(404)
                .json({ message: "Không tìm thấy người dùng" });
        res.json({ message: "Đã xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa", error: error.message });
    }
});

app.get("/", (req, res) => {
    res.send("hello");
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
