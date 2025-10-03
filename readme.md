# Walmart Scrapper

A Node.js web application for scraping product data from Walmart, managing products, and tracking stock and price changes.

## Features

- **Admin authentication** (login required)
- **Add new products** by scraping Walmart product URLs
- **Search products** by SKU
- **View products** by status:
  - In Stock
  - Out of Stock (with visual highlight for recently out-of-stock)
  - Price Changed
  - Back In Stock
  - Updated / Not Updated
- **Update all products** (re-scrape and refresh data)
- **Delete products**
- **Flash messages** for user feedback
- **Responsive UI** with Bootstrap and custom styles
- **DataTables** for searchable, paginated tables

## Tech Stack

- Node.js
- Express.js
- MongoDB (via Mongoose)
- EJS templating
- Puppeteer (for scraping)
- Cheerio (for HTML parsing)
- Passport.js (authentication)
- Bootstrap 4
- DataTables

## Folder Structure

```
/models         # Mongoose models
/public         # Static assets (CSS, JS, images)
/routes         # Express route files (admin.js, users.js)
/views          # EJS templates (admin, users, partials)
/config.env     # Environment variables
app.js          # Main application file
```

## Setup

1. **Clone the repository**
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Set up your environment variables**
   - Create a `config.env` file in the root directory:
     ```
     DATABASE_LOCAL=mongodb://localhost:27017/walmart-scrapper
     PORT=3000
     SESSION_SECRET=your_secret
     ```
4. **Run the app**
   ```sh
   npm start
   ```
   or
   ```sh
   node app.js
   ```

5. **Visit** [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Login/Register** as an admin user.
- **Add a product:** Go to "Add New Product", enter a Walmart product URL, click "Fetch Data", fill in the SKU, and save.
- **Search:** Use the SKU search to find products.
- **View tables:** Navigate to In Stock, Out of Stock, etc., to manage your products.
- **Update:** Use the update feature to re-scrape all products.

## Notes

- Puppeteer requires a Chromium download; first run may take longer.
- Make sure MongoDB is running locally or update `DATABASE_LOCAL` for your setup.
- For production, set `SESSION_SECRET` and use a secure session store.



