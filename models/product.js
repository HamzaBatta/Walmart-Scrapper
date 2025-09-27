const mongoose = require('mongoose');

let productSchema = new mongoose.Schema({
    title: String,
    newPrice: String,
    oldPrice: String,
    newStock: String,
    oldStock: String,
    sku: String,
    company: String,
    url: String,
    updateStatus: String,

});

module.exports = mongoose.model('Product', productSchema);