
const Orders = require('../models/orders');
const User = require('../models/user');
const product = require('../models/product');
const Revenue = require('../models/revenue');
exports.getAllOrders = async (req, res, next) => {
    try {
        const { status } = req.query;
        const listOrders = await Orders.find({});
        const a = listOrders.length;
        const b = listOrders.filter(order => order.status === 0).length;
        const c = listOrders.filter(order => order.status === 1).length;
        const d = listOrders.filter(order => order.status === 2).length;
        const e = listOrders.filter(order => order.status === 3).length;
        if (Number(status) === -1) {
            const orders = await Orders.find({})
                .populate({
                    path: "productDetail.productID",
                    populate: {
                        path: "types"
                    }
                })
                .populate("saleCode", "code discount type")
                .sort('-createdAt');
            res.status(200).json({
                status: "success",
                orders,
                ordersTotal: [a, b, c, d, e]
            })
        }
        else {
            const orders = await Orders.find({ status: status })
                .populate({
                    path: "productDetail.productID",
                    populate: {
                        path: "types"
                    }
                })
                .populate("saleCode", "code discount type")
                .sort("-createdAt");
            res.status(200).json({
                status: "success",
                orders,
                ordersTotal: [a, b, c, d, e]
            })
        }
    }
    catch (err) {
        res.json({
            status: "failed",
            err
        })
    }
}

exports.getListOrderByUser = async (req, res) => {
    try {
        const { userID } = req.user;
        const { status } = req.query;
        const listOrder = await Orders.find({ userID: userID })
            .populate({
                path: "productDetail.productID",
                populate: {
                    path: "types"
                }
            })
            .populate("saleCode", "code discount type")
            .sort("-createdAt");;
        const a = listOrder.length;
        const b = listOrder.filter(order => order.status === 0).length;
        const c = listOrder.filter(order => order.status === 1).length;
        const d = listOrder.filter(order => order.status === 2).length;
        const e = listOrder.filter(order => order.status === 3).length;
        if (Number(status) === -1) {
            res.status(200).json({
                status: "success",
                orders: listOrder,
                ordersTotal: [a, b, c, d, e]
            })
        } else {
            const listOrderFilter = await Orders.find({ userID: userID, status: status })
                .populate({
                    path: "productDetail.productID",
                    populate: {
                        path: "types"
                    }
                })
                .populate("saleCode", "code discount type")
                .sort("-createdAt");
            res.status(200).json({
                status: "success",
                orders: listOrderFilter,
                ordersTotal: [a, b, c, d, e]
            })
        }
    }
    catch (err) {
        res.json({
            status: "failed",
            err
        })
    }
}

exports.changeStatusOrders = async (req, res) => {
    try {
      const { userID } = req.user;
      const admin = await User.findById(userID);
      const orderID = req.body.orderID;
  
      if (admin.role === 'admin') {
        const newStatus = Number(req.body.status);
  
        // Cập nhật trạng thái đơn hàng
        const updatedOrder = await Orders.findByIdAndUpdate(orderID, { status: newStatus }, { new: true })
          .populate('productDetail.productID');
  
        // Nếu trạng thái đơn hàng là đã giao (status = 3), tính toán doanh thu
        if (newStatus === 3) {
          const existingRevenue = await Revenue.findOne({ orderID: orderID });
  
          if (!existingRevenue) {
            // Tính tổng tiền từ sản phẩm
            const totalAmount = updatedOrder.productDetail.reduce((acc, item) => {
              return acc + item.productID.price * item.quantity;
            }, 0);
            console.log("tong tien",totalAmount);
            await Revenue.create({
              orderID: updatedOrder._id,
              totalAmount,
              createdAt: new Date(),
            });
          }
        }
  
        res.json({
          status: 'success',
          updatedOrder,
        });
      } else {
        res.status(403).json({ message: 'Bạn không phải admin' });
      }
    } catch (err) {
      res.status(500).json({ status: 'failed', message: err.message });
    }
  };

exports.createOrders = async (req, res, next) => {
    try {
        const data = req.body;
        const newOrder = await Orders.create(data);
        res.status(200).json({
            status: "success",
            order: newOrder
        })
    }
    catch (err) {

    }
}


exports.deleteOneOrder = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const user = await User.findById(userID);
        const { id } = req.params;
        const order = await Orders.findById(id);
        if (user.role === 'admin' || user._id === order.userID) {
            const deleteOrder = await Orders.findByIdAndDelete(id);
            res.json({
                status: "success",
                deleteOrder
            })
        }
        else {
            res.json({
                messenger: "Lỗi"
            })
        }
    }
    catch (err) {
        res.json({
            err: err
        })
    }
}
