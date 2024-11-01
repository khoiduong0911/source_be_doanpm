const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bycript = require('bcryptjs');
const lodash = require('lodash');
const cloudinary = require('../untils/cloudinary');

exports.editProfile = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const uploader = async (path) => await cloudinary.uploads(path, 'avatar');
        const data = JSON.parse(req.body.user);
        const user = await User.findById(userID);
        let url = null;
        const files = req.files[0];
        if (files) {
            const { path } = files;
            url = await uploader(path);
            data.image = url.url;
        }
        if (data.password) {
            bycript.hash(data.password, 10, function (err, hash) {
                if (!err) {
                    user.password = hash;
                    user.save();
                }
            })
            delete data.password;
        }
        const userUpdate = await User.findByIdAndUpdate(userID, { ...data }, { runValidators: true, new: true })
        res.json({
            status: "success",
            user: userUpdate
        })
    }
    catch (err) {
        console.log(err)
    }
}

exports.changeRoleByAdmin = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const admin = await User.findById(userID);
        if (admin.role === 'admin') {
            const userUpdate = await User.findByIdAndUpdate(req.body.userID, {
                role: req.body.role
            });
            res.json({
                status: 'success',
                userUpdate
            })
        }
        else {
            res.json({
                status: "failed",
                messenger: "Ban khong phai admin"
            })
        }
    }
    catch (err) {

    }
}

exports.deleteOneUser = async (req, res, next) => {
    try {
        const { userID } = req.params;
        const user = await User.findByIdAndDelete(userID);
        res.json({
            status: "success"
        })
    }
    catch (err) {
        res.json({
            status: 'failed',
            messenger: err
        })
    }
}

exports.getAllUser = async (req, res, next) => {
    try {
        let limit = Math.abs(req.query.limit) || 5;
        let page = (Math.abs(req.query.page) || 1) - 1;
        const users = await User.find({})
            .populate('cart.product')
            .limit(limit)
            .skip(page * limit)
            .sort('role')
            .sort('-createdAt');
        let slUser = await User.find({});
        let totalPage = Math.ceil(slUser.length / limit);
        res.status(200).json({
            status: "success",
            result: users.length,
            users: users,
            totalPage: totalPage
        })
    }
    catch (err) {
        console.log(err)
    }
}
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { userID, status } = req.body; 
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ status: "failed", messenger: "Người dùng không tìm thấy" });
        }
        console.log('Trạng thái trước khi cập nhật:', user.status); // Ghi log trạng thái trước khi cập nhật
        user.status = status; 
        await user.save();
        console.log('Trạng thái sau khi cập nhật:', user.status); // Ghi log trạng thái sau khi cập nhật
        res.status(200).json({ status: "success", user });
    } catch (err) {
        console.log("Err", err);
        res.status(500).json({ status: "failed", messenger: "Lỗi server" });
    }
};

exports.getOneUser = async (req, res, next) => {
    try {
        const { userID } = req.params;
        const user = await User.findById(userID).populate('cart');
        res.status(200).json({
            status: "success",
            user
        })
    }
    catch (err) {

    }
}

// Cart by user

exports.addOneProductToCart = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const data = req.body;
        let reqPrice = req.body.price;
        const user = await User.findById(userID)
            .populate("cart.product");
        let index = await lodash._.findIndex(user.cart, (cart) => cart.product === data.product);
        if (index === -1) {
            delete data.price;
            user.cart.push(data);
            user.save(function (err, result) {
                if (err) {
                    res.json({
                        status: "failed"
                    })
                    return;
                }
                const subTotal = result.cart.reduce((total, cart, index) => {
                    if (index < result.cart.length - 1) {
                        let price = cart.product.sale > 0 ? cart.product.price - (cart.product.sale / 100 * cart.product.price) : cart.product.price;
                        return total + price * cart.quantity;
                    }
                    return total + reqPrice * cart.quantity;
                }, 0);
                const idCart = result.cart[result.cart.length - 1]._id;
                res.json({
                    status: "success",
                    subTotal,
                    idCart
                })
            });
        }
    }
    catch (err) {
        res.json({
            status: "failed",
            err
        })
    }
}

exports.getAllCart = async (req, res) => {
    try {
        const { userID } = req.user;
        const user = await User.findById(userID)
            .populate("cart.product");
        const listCart = user.cart;
        res.json({
            status: "success",
            listCart
        })
    }
    catch (err) {
        res.json({
            err,
            status: "failed"
        })
    }
}

exports.updateAllCart = async (req, res) => {
    try {
        const { userID } = req.user;
        const { newCart } = req.body;
        const user = await User.findById(userID)
            .populate("cart.product");
        if (user) {
            user.cart = newCart;
            user.save(function (err, result) {
                if (!err) {
                    const subTotal = result.cart.reduce((total, cart) => {
                        let price = cart.product.sale > 0 ? cart.product.price - (cart.product.sale / 100 * cart.product.price) : cart.product.price;
                        return total + price * cart.quantity;
                    }, 0);
                    res.json({
                        status: "success",
                        result,
                        subTotal
                    })
                } else {
                    console.log(err);
                }
            })
        }
    }
    catch (err) {

    }
}

exports.deleteProductToCart = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const { productID } = req.params;
        const user = await User.findById(userID)
            .populate("cart.product");
        let index = await lodash._.findIndex(user.cart, (cart) => cart.product._id == productID);
        if (index !== -1) {
            user.cart.splice(index, 1);
            user.save(function (err, result) {
                if (!err) {
                    const subTotal = result.cart.reduce((total, cart) => {
                        let price = cart.product.sale > 0 ? cart.product.price - (cart.product.sale / 100 * cart.product.price) : cart.product.price;
                        return total + price * cart.quantity;
                    }, 0);
                    res.json({
                        status: "success",
                        subTotal
                    })
                }
            });
        } else {
            console.log("ERR")
        }
    }
    catch (err) {

    }
}

exports.searchUserByEmail = async (req, res, next) => {
    try {
        const { keyword } = req.body;
        const user = await User.find({
            email: { $regex: keyword, $options: "i" }
        }).limit(5);
        res.json({
            status: "success",
            user
        })
    }
    catch (err) {
        console.log(err);
    }
}
