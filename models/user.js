const mongoose = require('mongoose');
const bycript = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true, trim: true, minLength: 6 },
    role: { type: String, required: true, default: "user" },
    image: { type: String, default: "https://res.cloudinary.com/phuctran/image/upload/v1628940172/dev_setups/igykdyqbyrhfpyolnx2k.jpg" },
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
            quantity: { type: Number, required: true }
        }
    ],
    phone: { type: String },
    status: { type: String, required: true, default: "hoạt động" }, 
    address: { type: String }
    
}, { timestamps: true })


// userSchema.pre('save', function (next) {
//     let user = this;
//     bycript.hash(user.password, 10, function (err, hash) {
//         if (!user) return next(err);
//         else {
//             user.password = hash;
//             next();
//         }
//     })
// })


const User = mongoose.model('user', userSchema); 

module.exports = User;