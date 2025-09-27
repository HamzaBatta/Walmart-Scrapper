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
        const html = await page.evaluate( () => document.body.innerHTML );
        const $ = await cheerio.load(html);

        let title = $('h1').innerText
        let price = $('span[itemprop="price"]').innerText

        let seller = ''
        let checkSeller = $('a[data-testid="seller-name-link"]').innerText
        if(checkSeller){
            seller = checkSeller.text()
        }
        if(seller=== ''){
            seller = $('span[data-testid="product-seller-info"]').innerText
        }

        let outOfStock = '';
        let checkOutOfStock = $('.lh-copy.pt2-m.flex.f4.items-center .b.gray.pr3.pt2-m.nowrap').innerText;
        if (checkOutOfStock){
            outOfStock = checkOutOfStock.text();
        }
        

        let deliveryNotAvailable = '';
        let checkDeliveryNotAvailable = $('div[data-seo-id="fulfillment-Delivery-intent"]').innerText;
        if (checkDeliveryNotAvailable){
            deliveryNotAvailable = checkDeliveryNotAvailable.text();
        }

        let stock = '';
        if(!(seller.includes('Walmart') || outOfStock.includes('Out of stock') || deliveryNotAvailable.includes('Not available'))){
            stock = 'Out of stock';
        }else {
            stock = 'In Stock';
        }

        return {title,price,stock,url};

    }catch(err){
        console.log(err);
    }
}

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


module.exports = router;