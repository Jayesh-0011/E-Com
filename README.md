# 🛒 QuickShop E-Commerce Platform

<div align="center">

![QuickShop Logo](https://img.shields.io/badge/QuickShop-E--Commerce-blue?style=for-the-badge&logo=shopping-cart)

**A comprehensive multi-role e-commerce platform connecting Customers, Retailers, Wholesalers, and Delivery Partners**

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-MSSQL-red?style=flat-square&logo=microsoft-sql-server)](https://www.microsoft.com/sql-server)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [User Roles & Features](#-user-roles--features)
- [Authentication & Security](#-authentication--security)
- [Order Management](#-order-management)
- [Product Management](#-product-management)
- [Communication Features](#-communication-features)
- [Email Notifications](#-email-notifications)
- [Delivery Management](#-delivery-management)
- [Payment Integration](#-payment-integration)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [API Endpoints](#-api-endpoints)

---

## 🎯 Overview

QuickShop is a full-stack e-commerce platform designed to facilitate seamless transactions between multiple stakeholders in the supply chain. The platform supports four distinct user roles, each with specialized dashboards and functionalities.

### Core Concept
- **Customers** browse and purchase products from **Retailers**
- **Retailers** manage inventory, fulfill customer orders, and source products from **Wholesalers**
- **Wholesalers** supply products to retailers and manage bulk orders
- **Delivery Partners** handle order fulfillment and tracking

---

## ✨ Key Features

### 🔐 Authentication & Security
- ✅ **Multi-role Authentication** (Customer, Retailer, Wholesaler, Delivery)
- ✅ **Email OTP Verification** for secure account creation
- ✅ **Google OAuth Integration** for quick sign-in
- ✅ **JWT Token-based Authentication** for secure API access
- ✅ **Password Hashing** using bcrypt
- ✅ **Show/Hide Password** toggle for better UX
- ✅ **Email Verification** system with OTP expiry (10 minutes)

### 📦 Order Management
- ✅ **Real-time Order Tracking** with status updates
- ✅ **Order Status Progression**: Placed → Confirmed → Dispatched → Delivered
- ✅ **Delivery Confirmation** by recipients (Customer & Retailer)
- ✅ **Order History** with detailed information
- ✅ **Order Filtering & Sorting**:
  - Filter by status (Pending, Dispatched, Delivered)
  - Sort by Most Recent, Pending, Query Status
- ✅ **Product Images** in order cards
- ✅ **Order & Delivery Date Tracking**

### 🛍️ Product Management
- ✅ **Inventory Management** for Retailers & Wholesalers
- ✅ **Product CRUD Operations** (Create, Read, Update, Delete)
- ✅ **Product Categories** organization
- ✅ **Stock Management** with real-time updates
- ✅ **Product Images** upload and display
- ✅ **Product Search & Filtering**
- ✅ **Distance-based Product Discovery** (for customers)

### 💬 Communication Features
- ✅ **Real-time Query System** between Customers and Retailers
- ✅ **Fixed Chatbox UI** (bottom-right corner, always visible)
- ✅ **Message History** with timestamps
- ✅ **Query Status Tracking** (Unresolved/Resolved)
- ✅ **Optimistic UI Updates** for instant feedback
- ✅ **Auto-scrolling** message container

### 📧 Email Notifications
- ✅ **Order Status Updates** via email
- ✅ **Beautiful HTML Email Templates**
- ✅ **Email Notifications for**:
  - Order Confirmation
  - Order Dispatch
  - Order Delivery
- ✅ **Nodemailer Integration** with Gmail/ProtonMail support

### 🚚 Delivery Management
- ✅ **Active Orders Dashboard** for delivery partners
- ✅ **Past Orders History**
- ✅ **Order Status Updates** (Pickup → In Transit → Delivered)
- ✅ **Dynamic Metrics Dashboard**:
  - Active Deliveries Count
  - Completed Today
  - Total Delivered
- ✅ **Username Display** (instead of UIDs)
- ✅ **Order Type Tags** (Retailer Order / Wholesaler Order)

### 💳 Payment Integration
- ✅ **Stripe Payment Gateway** integration
- ✅ **Secure Payment Processing**
- ✅ **Payment Confirmation** workflow

### 👤 Profile Management
- ✅ **User Profile Editing**
- ✅ **Address Management** with auto-location detection
- ✅ **OpenStreetMap Integration** for address auto-fill
- ✅ **Profile Information Updates**

---

## 👥 User Roles & Features

### 🛒 Customer Dashboard

#### Home Page (`/customer/home`)
- **Browse Products** from all retailers
- **Product Search & Filter** by category
- **Distance-based Sorting** (nearest retailers first)
- **Product Details** with ratings and reviews
- **Add to Cart** functionality
- **Shopping Cart Management**
- **Checkout Process**

#### Orders Page (`/customer/orders`)
- **View All Orders** with detailed information
- **Order Status Tracking** with progress bar
- **Product Images** in order cards
- **Order & Delivery Dates** display
- **Filter Orders** by:
  - Delivery Pending
  - Dispatched
  - Delivered
- **Sort Orders** by:
  - Most Recent
  - Pending
  - Query Unresolved
  - Query Resolved
- **Raise Queries** about orders
- **Real-time Chat** with retailers
- **Submit Feedback & Ratings** (1-5 stars)
- **Confirm Delivery** after receiving order

---

### 🏪 Retailer Dashboard

#### Home Page (`/retailer/home`)
- **Browse Wholesaler Products**
- **View Product Catalog** from wholesalers
- **Place Orders** to wholesalers
- **Product Search & Filter**

#### Inventory Management (`/retailer/inventory`)
- **Add Products** to inventory
- **Update Product Details** (name, price, stock, category, image)
- **Delete Products**
- **Stock Management**
- **Product Image Upload**

#### Customer Orders (`/retailer/customer-orders`)
- **View Customer Orders**
- **Update Order Status**:
  - Confirm Order
  - Mark as Dispatched
  - Assign Delivery Driver
- **Product Images** in order cards
- **Order & Delivery Dates**
- **Filter & Sort Orders**
- **Respond to Customer Queries** via real-time chat
- **Resolve/Unresolve Queries**
- **Email Notifications** to customers

#### Wholesaler Orders (`/retailer/wholesaler-orders`)
- **View Orders** placed with wholesalers
- **Track Order Status**
- **Product Images** display
- **Order & Delivery Dates**
- **Filter & Sort Orders**
- **Confirm Delivery** after receiving from wholesaler

---

### 🏭 Wholesaler Dashboard

#### Home Page (`/wholesaler/home`)
- **Manage Inventory** (Add/Update/Delete products)
- **Product Stock Management**
- **Product Image Management**
- **Category Organization**

#### Retailer Orders (`/wholesaler/transactions`)
- **View Retailer Orders**
- **Update Order Status**:
  - Confirm Order
  - Mark as Dispatched
  - Assign Delivery Driver
- **Product Images** in order cards
- **Order & Delivery Dates**
- **Filter & Sort Orders**
- **Email Notifications** to retailers
- **Delivery Driver Assignment**

---

### 🚛 Delivery Partner Dashboard

#### Active Orders (`/delivery/home`)
- **View Active Deliveries**
- **Order Details** with:
  - Customer/Retailer names (not UIDs)
  - Product information
  - Delivery address
  - Order type tags (Retailer/Wholesaler)
- **Update Order Status**:
  - Pickup
  - In Transit
  - Delivered
- **Dynamic Metrics**:
  - Active Deliveries
  - Completed Today
  - Total Delivered
- **Real-time Status Updates**

#### Past Orders (`/delivery/past-orders`)
- **View Delivery History**
- **Past Order Details**
- **Delivery Statistics**
- **Performance Metrics**

---

## 🔐 Authentication & Security

### Sign Up Features
- **Role Selection** (Customer, Retailer, Wholesaler, Delivery)
- **Email OTP Verification** (6-digit code, 10-minute expiry)
- **Google OAuth** integration
- **Password Strength** requirements
- **Show/Hide Password** toggle
- **Address Auto-fill** using geolocation (OpenStreetMap)
- **Phone Number** with country code selection
- **Form Validation**

### Login Features
- **Email/Username Login**
- **Password Authentication**
- **Show/Hide Password** toggle
- **Google OAuth** quick login
- **OTP Verification** for unverified emails
- **Role-based Redirect** after login
- **Error Handling** with user-friendly messages

### Security Features
- **JWT Token Authentication**
- **Password Hashing** (bcrypt, 10 rounds)
- **Protected Routes** with role-based access
- **Token Expiry** management
- **Secure API Endpoints**

---

## 📦 Order Management

### Order Lifecycle
1. **Placed** - Customer/Retailer places order
2. **Confirmed** - Seller confirms the order
3. **Dispatched** - Order shipped with delivery driver assigned
4. **Delivered** - Delivery partner marks as delivered
5. **Confirmed by Recipient** - Customer/Retailer confirms receipt

### Order Features
- **Real-time Status Updates**
- **Email Notifications** at each stage
- **Delivery Confirmation** workflow
- **Order History** with timestamps
- **Product Images** in order display
- **Order & Delivery Date** tracking
- **Order Filtering & Sorting**

---

## 🛍️ Product Management

### Retailer Inventory
- **Add Products** with:
  - Product ID
  - Product Name
  - Price
  - Stock Quantity
  - Category
  - Product Image
- **Update Existing Products**
- **Delete Products**
- **Stock Management**

### Wholesaler Inventory
- **Bulk Product Management**
- **Product Catalog** for retailers
- **Stock Tracking**
- **Product Image Management**

### Customer Product View
- **Product Listings** with images
- **Product Details**:
  - Name, Price, Stock
  - Category
  - Retailer Information
  - Average Rating
  - Review Count
- **Distance-based Sorting**
- **Product Search**

---

## 💬 Communication Features

### Query System
- **Raise Queries** about orders
- **Real-time Chat** interface
- **Fixed Chatbox** (bottom-right, always visible)
- **Message History** with timestamps
- **Query Status** (Unresolved/Resolved)
- **Retailer Response** functionality

### Chat Features
- **Optimistic UI Updates** for instant feedback
- **Auto-scrolling** message container
- **Message Timestamps**
- **Real-time Message Updates**
- **Portal-based UI** for fixed positioning

---

## 📧 Email Notifications

### Email Templates
- **Order Confirmation** email
- **Order Dispatch** notification
- **Order Delivery** confirmation
- **Beautiful HTML Templates** with:
  - Order details
  - Product information
  - Order dates
  - Status updates

### Email Configuration
- **Gmail Integration** support
- **ProtonMail Integration** support
- **Nodemailer** for email delivery
- **Environment Variable** configuration

---

## 🚚 Delivery Management

### Active Orders
- **Order Assignment** to delivery drivers
- **Status Updates** (Pickup → In Transit → Delivered)
- **Customer/Retailer Information** display
- **Delivery Address** tracking
- **Order Type Identification** (Retailer/Wholesaler orders)

### Metrics Dashboard
- **Active Deliveries** count
- **Completed Today** statistics
- **Total Delivered** count
- **Real-time Updates**

### Past Orders
- **Delivery History**
- **Performance Tracking**
- **Statistics Overview**

---

## 💳 Payment Integration

### Stripe Integration
- **Secure Payment Processing**
- **Payment Gateway** integration
- **Payment Confirmation** workflow
- **Transaction Management**

---

## 🛠️ Technology Stack

### Frontend
- **React 18+** - UI Framework
- **React Router** - Navigation
- **Context API** - State Management
- **React Portals** - UI Components
- **Tailwind CSS** - Styling
- **Firebase Auth** - Google OAuth

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MSSQL (SQL Server)** - Database
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **Nodemailer** - Email Service
- **Stripe** - Payment Processing

### Database
- **Microsoft SQL Server**
- **Multiple Tables**:
  - `users` - User accounts
  - `user_addresses` - User addresses
  - `retailer_inventory` - Retailer products
  - `wholesaler_inventory` - Wholesaler products
  - `customer_orders` - Customer orders
  - `retailer_orders` - Retailer orders
  - `customer_queries` - Customer queries
  - `delivery_drivers` - Delivery partner info

### Development Tools
- **Vite** - Build Tool
- **ESLint** - Code Linting
- **Git** - Version Control

---

## 📁 Project Structure

```
E-Commerce/
├── src/
│   ├── pages/
│   │   ├── dashboards/
│   │   │   ├── customer/
│   │   │   │   ├── ConsumerDashboard.jsx
│   │   │   │   └── ConsumerOrders.jsx
│   │   │   ├── retailer/
│   │   │   │   ├── RetailerHome.jsx
│   │   │   │   ├── RetailerInventory.jsx
│   │   │   │   ├── RetailerCustomerOrder.jsx
│   │   │   │   └── RetailerWholesaleOrders.jsx
│   │   │   ├── wholesaler/
│   │   │   │   ├── WholesalerHome.jsx
│   │   │   │   └── WholesalerTransactions.jsx
│   │   │   ├── Delivery/
│   │   │   │   ├── Delivery.jsx
│   │   │   │   ├── DeliveryPastOrders.jsx
│   │   │   │   └── OrderCard.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── Login.jsx
│   │   ├── SignUp.jsx
│   │   ├── HomePage.jsx
│   │   └── Payment.jsx
│   ├── context/
│   │   ├── AuthProvider.jsx
│   │   └── ToastContext.jsx
│   ├── Routes/
│   │   └── PrivateRoute.jsx
│   ├── firebase.js
│   └── App.jsx
├── Backend/
│   ├── routes/
│   │   ├── ConsumerRoutes.js
│   │   ├── RetailerRoutes.js
│   │   ├── WholesalerRoutes.js
│   │   └── DeliveryRoutes.js
│   ├── db.js
│   └── server.js
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- SQL Server (MSSQL)
- npm or yarn

### Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Backend Setup

1. **Navigate to Backend Directory**
   ```bash
   cd Backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `Backend` directory:
   ```env
   SECRET=your_jwt_secret_key
   DB_SERVER=your_sql_server
   DB_DATABASE=your_database_name
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Start Backend Server**
   ```bash
   node server.js
   ```

### Database Setup

1. **Create Database** in SQL Server
2. **Run Migration Scripts** (if available)
3. **Configure Connection** in `Backend/db.js`

---

## 📡 API Endpoints

### Authentication
- `POST /manual-signup` - User registration
- `POST /manual-login` - User login
- `POST /google-signup` - Google OAuth signup
- `POST /google-login` - Google OAuth login
- `POST /api/auth/send-otp` - Send OTP for email verification
- `POST /api/auth/verify-otp` - Verify OTP

### Customer Routes
- `GET /api/consumer/retailer-products` - Get all retailer products
- `GET /api/consumer/orders` - Get customer orders
- `POST /api/consumer/orders/feedback` - Submit order feedback
- `POST /api/consumer/orders/:order_id/confirm-delivery` - Confirm delivery

### Retailer Routes
- `GET /api/retailer/inventory` - Get retailer inventory
- `POST /api/retailer/inventory` - Add/Update product
- `DELETE /api/retailer/inventory/:product_id` - Delete product
- `GET /api/retailer/customer-orders` - Get customer orders
- `PUT /api/retailer/put/put/put/update-status` - Update order status
- `GET /api/retailer/wholesaler-products` - Get wholesaler products
- `POST /api/retailer/orders/:order_id/confirm-delivery` - Confirm delivery

### Wholesaler Routes
- `GET /api/wholesaler/stock` - Get wholesaler inventory
- `POST /api/wholesaler/stock` - Add product
- `PUT /api/wholesaler/stock/:product_id` - Update product
- `DELETE /api/wholesaler/stock/:product_id` - Delete product
- `GET /api/wholesaler/orders` - Get retailer orders
- `PUT /api/wholesaler/orders/:orderId/status` - Update order status
- `GET /api/wholesaler/delivery-drivers` - Get delivery drivers

### Delivery Routes
- `GET /api/delivery/orders` - Get active orders
- `GET /api/delivery/past-orders` - Get past orders
- `PUT /api/delivery/orders/status` - Update order status
- `GET /api/delivery/metrics` - Get delivery metrics

---

## 🎨 UI/UX Features

### Design Elements
- **Modern Gradient Backgrounds**
- **Glassmorphism Effects**
- **Smooth Animations & Transitions**
- **Responsive Design** (Mobile, Tablet, Desktop)
- **Dark Theme** with blue accents
- **Toast Notifications** for user feedback
- **Loading States** for async operations
- **Error Handling** with user-friendly messages

### User Experience
- **Fixed Chatbox** (always accessible)
- **Auto-scrolling** message containers
- **Optimistic UI Updates**
- **Real-time Status Updates**
- **Intuitive Navigation**
- **Role-based Dashboards**

---

## 🔄 Workflow Examples

### Customer Order Flow
1. Customer browses products on home page
2. Adds products to cart
3. Proceeds to checkout
4. Places order (status: "Placed")
5. Retailer confirms order (status: "Confirmed")
6. Retailer dispatches with delivery driver (status: "Dispatched")
7. Delivery partner marks as delivered (status: "Delivered")
8. Customer confirms delivery
9. Customer can submit feedback and rating

### Retailer Order Flow (from Wholesaler)
1. Retailer browses wholesaler products
2. Places order with wholesaler
3. Wholesaler confirms order
4. Wholesaler dispatches with delivery driver
5. Delivery partner delivers to retailer
6. Retailer confirms delivery

---

## 📝 Notes

- **Email Configuration**: Set up `EMAIL_USER` and `EMAIL_PASS` in `.env` for email notifications
- **Database**: Ensure SQL Server is running and accessible
- **Firebase**: Configure Firebase for Google OAuth
- **Stripe**: Add Stripe keys for payment processing

---

## 🤝 Contributing

This is a project for educational purposes. Feel free to fork and modify as needed.

---

## 📄 License

This project is for educational use.

---

<div align="center">

**Built with ❤️ using React & Node.js**

[Report Bug](https://github.com) · [Request Feature](https://github.com)

</div>
