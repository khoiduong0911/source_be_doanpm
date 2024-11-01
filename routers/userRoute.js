const express = require('express');

const Router = express.Router();
const {
    editProfile,
    getAllUser,
    getOneUser,
    addOneProductToCart,
    deleteProductToCart,
    deleteOneUser,
    updateUserStatus,
    searchUserByEmail,
    changeRoleByAdmin,
    updateAllCart,
    getAllCart
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/verifyToken');

Router.route('/').post(verifyToken, editProfile)

Router.route("/search").post(searchUserByEmail);

Router.route('/update-status').post(verifyToken, updateUserStatus);

Router.route('/role').post(verifyToken, changeRoleByAdmin);

Router.route('/').get(getAllUser);

Router.route('/:userID').get(getOneUser);

Router.route('/:userID').delete(deleteOneUser);
// Cart
Router.route("/cart/all").post(verifyToken, getAllCart);

Router.route('/cart/update-all').post(verifyToken, updateAllCart);

Router.route('/cart').post(verifyToken, addOneProductToCart);

Router.route("/cart/:productID").delete(verifyToken, deleteProductToCart);

module.exports = Router;