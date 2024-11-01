const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Nhớ import model User

exports.checkCurrentUser = async (req, res, next) => {
    const Authorization = req.header('Authorization');
    if (!Authorization) {
        req.user = null;
        return next();
    }

    try {
        const token = Authorization.replace('Bearer ', '');
        const { userID } = jwt.verify(token, process.env.APP_SECERT);
        
        // Truy vấn người dùng từ cơ sở dữ liệu
        const user = await User.findById(userID);
        if (!user || user.status === 'Không hoạt động') {
            req.user = null; // Hoặc bạn có thể trả về một thông báo lỗi
        } else {
            req.user = { userID, role: user.role }; // Bạn có thể lưu thêm thông tin khác nếu cần
        }
    } catch (err) {
        req.user = null;
    } finally {
        next();
    }
}
