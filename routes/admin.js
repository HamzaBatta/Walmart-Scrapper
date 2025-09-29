const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

//requiring product model
let Product = require('../models/product');

//Check if admin is authenticated
function isAuthenticated (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg', 'Please login to view this page');
    res.redirect('/login');
}

let browser;
//Scrape function
async function scrapeData(url,page){

    try{
        
        await page.goto(url, { waitUntil: 'load', timeout: 0});
        await page.waitForSelector('h1', { timeout: 10000000 });
        const html = await page.evaluate( () => document.body.innerHTML );
        const $ = await cheerio.load(html);

        let title = $('h1').text().trim();
        let rawPrice = $('span[itemprop="price"]').text().trim();
        let price = rawPrice.replace(/^(Now|Was)\s*/i, '').trim();

        let seller =
        $('a[data-testid="seller-name-link"]').text().trim() ||
        $('span[data-testid="product-seller-info"]').text().trim();

        let outOfStock = '';
        let checkOutOfStock = $('.lh-copy.pt2-m.flex.f4.items-center .b.gray.pr3.pt2-m.nowrap').text().trim();
        if (checkOutOfStock){
            outOfStock = checkOutOfStock;
        }
        
        let deliveryOptions = true;
        
        let delivery = $('div[data-seo-id="fulfillment-Delivery-intent"]').text().trim();
        let shipping = $('div[data-seo-id="fulfillment-Shipping-intent"]').text().trim();
        let pickup = $('div[data-seo-id="fulfillment-Pickup-intent"]').text().trim();

        if(delivery.includes('Not available') && shipping.includes('Out of stock') && pickup.includes('Not available')){
            deliveryOptions = false
        }
        
        let stock = 'In stock';
        if(!(seller.includes('Walmart')) || outOfStock.includes('Out of stock') || deliveryOptions == false){
            stock = 'Out of stock';
        }

        return {title,price,stock,url};

    }catch(err){
        console.log(err);
    }
}

//GET routes
router.get('/product/new', isAuthenticated, async(req, res) => {
    try{
        let url = req.query.search
        if(url){
            browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            let result = await scrapeData(url,page);

            let productData = {
                title: result.title,
                price: result.price,
                stock: result.stock,
                productUrl: result.url 
            };
            res.render('./admin/newproduct', { productData: productData });
            browser.close();
        }else{
            let productData = {
                title: '',
                price: '',
                stock: '',
                productUrl: '' 
            };
            res.render('./admin/newproduct', { productData: productData });
        }
    }catch(err){
        req.flash('error_msg', 'Error occured while fetching the data');
        res.redirect('/product/new');
    }
});

router.get('/product/search', isAuthenticated, (req,res) => {
    let userSKU = req.query.sku;
    if(userSKU){
        Product.findOne({sku:userSKU}).then(product => {
            if(!product){
                req.flash('error_msg', 'Product not found');
                res.redirect('/product/search');
            }
            res.render('./admin/search' , {productData: product})
        }).catch(err =>{
            req.flash('error_msg', 'Error occured while fetching the data');
            res.redirect('/product/search');
        })
    }else{
        res.render('./admin/search', {productData : ''})
    }
})

router.get('/products/instock', isAuthenticated, (req,res) => {
    Product.find({newStock: "In stock"}).then(products => {
        res.render('./admin/instock', {products: products});
    }).catch(err =>{
        req.flash('error_msg', 'Error occured while fetching the data');
        res.redirect('/dashboard');
    })
})

router.get('/products/outofstock', isAuthenticated, (req,res) => {
    Product.find({newStock: "Out of stock"}).then(products => {
        res.render('./admin/outofstock', {products: products});
    }).catch(err =>{
        req.flash('error_msg', 'Error occured while fetching the data');
        res.redirect('/dashboard');
    })
})


//POST routes
router.post('/product/new',isAuthenticated,(req,res)=> {
    let {title,price,stock,url,sku} = req.body;

    let newProduct = {
        title: title,
        newPrice: price,
        oldPrice: price,
        newStock: stock,
        oldStock: stock,
        sku: sku,
        company: "Walmart",
        url: url,
        updateStatus: "Updated"
    }

    Product.findOne({sku : sku}).then(product => {
        if(product){
            req.flash('error_msg',"Product already exists in database")
            return res.redirect('/product/new')
        }
        Product.create(newProduct).then(product => {
            req.flash('success_msg',"Product added successfully in database")
            return res.redirect('/product/new')
        }).catch(err => {
            req.flash('error_msg',"ERROR: " + err)
            res.redirect('/product/new');
        })
    })
})


module.exports = router;