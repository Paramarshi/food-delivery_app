# Grocery Mart - Food Delivery App

A modern, responsive food delivery application built with vanilla JavaScript, Tailwind CSS, and Vercel serverless functions.

## 📁 Project Structure

```
grocery-mart-delivery/
├── public/                    # Frontend files (served by Vercel)
│   ├── index.html            # Main landing page
│   ├── items.html            # Product catalog page
│   └── prototype.html        # Prototype/demo page
├── api/                      # Serverless API functions
│   ├── products.js           # Get products endpoint
│   ├── orders.js             # Order management endpoints
│   ├── users.js              # User management endpoints
│   ├── payment-verify.js     # Payment verification
│   └── health.js             # Health check endpoint
├── package.json              # Project dependencies
├── vercel.json               # Vercel deployment configuration
└── README.md                 # This file
```

## 🛠️ Features

- **Modern UI**: Clean, responsive design with dark/light theme
- **Real-time Cart**: Add/remove items with instant updates
- **Fast Checkout**: Streamlined order process
- **Order Tracking**: View order history and status
- **Profile Management**: User profile and address management
- **Mobile Responsive**: Works perfectly on all devices
- **Serverless Backend**: Scalable API with PostgreSQL database

### 🔧 Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd grocery-mart-delivery
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL
   ```

4. **Start development server**:
   ```bash
   vercel dev
   ```
   
   Or use a simple HTTP server for frontend-only testing:
   ```bash
   python -m http.server 8000 --directory public
   ```

5. **Access the application**:
   - Vercel dev: `http://localhost:3000`
   - Python server: `http://localhost:8000`

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/products` | GET | Get all products |
| `/api/orders` | GET | Get all orders |
| `/api/orders` | POST | Create new order |
| `/api/orders?userId=X` | GET | Get orders by user |
| `/api/orders?id=X` | PUT | Update order status |
| `/api/users` | POST | Create/update user |
| `/api/users?userId=X` | GET | Get user profile |
| `/api/payment-verify` | POST | Verify payment |

## 🎨 Customization

### Theme Colors
Edit CSS variables in the HTML files to change the color scheme:

```css
:root {
    --accent-color-1: #84cc16; /* Primary green */
    --accent-color-2: #a3e635; /* Secondary green */
    --bg-light: #f7fee7;       /* Light background */
    --text-light: #1a2e05;     /* Dark text */
}
```

### Add New Products
Modify the products array in the API or frontend files to add new items.

### Database Schema
The application automatically creates the following tables:
- `products`: Product catalog
- `orders`: Order records
- `users`: User profiles

## 🔒 Security Notes

- All API endpoints include CORS configuration
- Database connections use SSL by default
- User input is sanitized for SQL injection prevention
- Environment variables are used for sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your `DATABASE_URL` is correct
   - Ensure your database allows external connections
   - Check if SSL is required

2. **API Not Working**:
   - Check Vercel function logs in the dashboard
   - Verify environment variables are set
   - Ensure API routes match the frontend calls

3. **Frontend Not Loading**:
   - Check browser console for errors
   - Verify all file paths are correct
   - Ensure Tailwind CSS is loading from CDN

### Debug Mode

Add `console.log` statements in your API functions and check the Vercel function logs in your dashboard.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues during deployment:

1. Check Vercel's [deployment documentation](https://vercel.com/docs)
2. Review the [troubleshooting guide](https://vercel.com/docs/troubleshooting)
3. Check your database provider's documentation
4. Open an issue in this repository

---

**Happy Coding! 🚀**
