# Little Barbershop - Frontend

Modern, responsive frontend for the Little Barbershop Management System built with Next.js, React, TypeScript, and Material-UI.

## 🚀 Features

### 🎯 **Multi-Role Interface**
- **Boss Dashboard**: Complete system management with staff oversight
- **Staff Dashboard**: Appointment and client management
- **Client Portal**: QR-based booking system with service selection

### 📱 **QR Booking System**
- **QR Landing Page**: Seamless entry point for clients
- **Client Onboarding**: Quick registration with phone validation
- **Service Selection**: Interactive package browsing with images
- **Enhanced Booking**: Barber selection and multiple services
- **Real-time Pricing**: Dynamic total calculation

### 💼 **Admin Dashboard**
- **Role-Based Navigation**: Dynamic sidebar based on user permissions
- **Appointment Management**: Complete booking lifecycle management
- **Client Management**: Customer database with booking history
- **Staff Management**: User roles, activation, and permissions
- **Package Management**: Service catalog with pricing and images
- **Analytics Dashboard**: Business insights and metrics

### 🎨 **Design & UX**
- **Mobile-First**: Responsive design for all screen sizes
- **Modern UI**: Material-UI components with custom styling
- **Consistent Branding**: Professional barbershop aesthetic
- **Intuitive Navigation**: Role-based menu system
- **Real-time Updates**: Dynamic content and notifications

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI)
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: React Hooks + Context
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT tokens with role-based access
- **File Upload**: Multer integration
- **Responsive Design**: Mobile-first approach

## 📋 Key Pages & Components

### 🔐 **Authentication**
- `/login` - Staff/Boss login
- `/register` - Staff registration (requires activation)
- `/login/boss-portal` - Secret Boss registration portal

### 🏠 **Dashboard Pages**
- `/dashboard` - Analytics and overview
- `/dashboard/appointments` - Appointment management
- `/dashboard/clients` - Client database
- `/dashboard/products` - Package/service management
- `/dashboard/staff` - User management (Boss only)
- `/dashboard/settings` - Profile and business settings

### 📱 **Client Portal**
- `/qr` - QR code landing page
- `/client/onboarding` - New client registration
- `/client/login` - Existing client login
- `/client/packages` - Service selection and booking

### 🧩 **Reusable Components**
- **Layout System**: Responsive dashboard layout
- **Role Guards**: Permission-based component rendering
- **Form Components**: Validated forms with error handling
- **Data Tables**: Responsive tables with mobile card layouts
- **Modals**: Confirmation and form dialogs
- **Navigation**: Dynamic sidebar and header

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- Backend API running (little-backend)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/arifsufri/little-frontend.git
   cd little-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure API base URL
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Docker Setup

1. **Using Docker Compose** (from parent directory)
   ```bash
   docker compose up little-frontend
   ```

## 🌟 Enhanced Features

### 📊 **Dashboard Analytics**
- **Real-time Metrics**: Total clients, appointments, revenue
- **Business Insights**: Daily/monthly performance tracking
- **Visual Charts**: Revenue trends and appointment statistics

### 🎯 **Advanced Booking**
- **Barber Selection**: Choose specific staff members
- **Multiple Services**: Add multiple packages to single booking
- **Price Calculator**: Real-time total with service breakdown
- **Booking Summary**: Comprehensive appointment details

### 👥 **User Management**
- **Role System**: Boss > Staff > Client hierarchy
- **Account Activation**: Boss approval for staff accounts
- **Permission Control**: Feature access based on roles
- **Profile Management**: Avatar upload and settings

### 📱 **Mobile Experience**
- **Responsive Tables**: Card-based layout for mobile
- **Touch-Friendly**: Optimized for mobile interactions
- **Progressive Enhancement**: Works on all devices
- **Fast Loading**: Optimized performance

## 🎨 Design System

### **Color Palette**
- **Primary**: Professional barbershop colors
- **Secondary**: Warm accent colors
- **Status**: Success, warning, error indicators
- **Neutral**: Clean grays and whites

### **Typography**
- **Headers**: Bold, professional fonts
- **Body**: Clean, readable text
- **UI Elements**: Consistent sizing and spacing

### **Components**
- **Cards**: Elevated surfaces with shadows
- **Buttons**: Consistent styling across actions
- **Forms**: Validated inputs with clear feedback
- **Navigation**: Intuitive menu systems

## 🔐 Authentication Flow

### **Staff/Boss Login**
1. Login with email/password
2. JWT token stored locally
3. Role-based dashboard access
4. Automatic token refresh

### **Client Portal**
1. QR code scan → Landing page
2. Registration or login
3. Service browsing and booking
4. Session-based access

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px (Card layouts, stacked navigation)
- **Tablet**: 768px - 1024px (Hybrid layouts)
- **Desktop**: > 1024px (Full table layouts, sidebar navigation)

### **Mobile Optimizations**
- **Touch Targets**: Minimum 44px touch areas
- **Readable Text**: Appropriate font sizes
- **Fast Loading**: Optimized images and code splitting
- **Offline Support**: Service worker integration

## 🚀 Deployment

### **Build for Production**
```bash
npm run build
npm start
```

### **Environment Variables**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### **Docker Deployment**
The frontend is containerized and ready for production deployment.

## 📄 License

This project is part of the Little Barbershop Management System.
