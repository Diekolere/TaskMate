import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import NetworkStatus from './components/common/NetworkStatus';
import Landing from './pages/public/Landing'
// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import OAuthCallback from './pages/auth/OAuthCallback';
// Customer Pages
import Onboarding from './pages/customer/Onboarding';
import InviteFriends from './pages/customer/InviteFriends';
import Dashboard from './pages/customer/Dashboard';
import PostRequest from './pages/customer/PostRequest';
import BrowseProviders from './pages/customer/BrowseProviders';
import ProviderProfile from './pages/customer/ProviderProfile';
import RequestStatus from './pages/customer/RequestStatus';
import ServiceReview from './pages/customer/ServiceReview';
import Settings from './pages/customer/Settings';
import SavedProviders from './pages/customer/SavedProviders';
import MyRequests from './pages/customer/MyRequests';
import Payment from './pages/customer/Payment';

// Provider Pages
import ProviderInviteFriends from './pages/provider/InviteFriends';
import KYCGate from './components/provider/KYCGate';
import ProviderDashboard from './pages/provider/Dashboard';
import RequestDetails from './pages/provider/RequestDetails';
import Schedule from './pages/provider/Schedule';
import CategoryGate from './components/provider/CategoryGate';

import Requests from './pages/provider/Requests';
import MyJobs from './pages/provider/MyJobs';
import JobDetails from './pages/provider/JobDetails';
import Earnings from './pages/provider/Earnings';
import MyProfile from './pages/provider/Profile';
import ProviderSettings from './pages/provider/Settings';
import ChangePassword from './pages/provider/ChangePassword';
import CreateServicePost from './pages/provider/CreateServicePost';
import Support from './pages/provider/Support';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminVerifications from './pages/admin/Verifications';
import AdminCommission from './pages/admin/Commission';
import AdminUsers from './pages/admin/Users';
import AdminRequests from './pages/admin/Requests';
import AdminSettings from './pages/admin/Settings';
import AdminLogin from './pages/admin/Login';
import AdminSupport from './pages/admin/Support';
import AdminUserDetails from './pages/admin/UserDetails';
import AdminRequestDetails from './pages/admin/RequestDetails';
import AdminVerificationDetails from './pages/admin/VerificationDetails';

import PaymentCheckout from './pages/customer/PaymentCheckout';
import JobOTP from './pages/customer/JobOTP';
import ConfirmCompletion from './pages/customer/ConfirmCompletion';
import JobStart from './pages/provider/JobStart';
import ProtectedRoute from './components/ProtectedRoute';
import AIChat from './components/customer/AIChat';
import DeletedAccountModal from './components/auth/DeletedAccountModal';

function AnimatedRoutes() {
  const location = useLocation();
  const isCustomerPlatform = location.pathname.startsWith('/customer');
  
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        
        {/* Customer Routes */}
        <Route path="/dashboard" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><Dashboard /></ProtectedRoute>} />
        <Route path="/customer/onboarding" element={<ProtectedRoute allowedRoles={['customer']}><Onboarding /></ProtectedRoute>} />
        <Route path="/customer/post-request" element={<ProtectedRoute allowedRoles={['customer']}><PostRequest /></ProtectedRoute>} />
        <Route path="/customer/browse" element={<ProtectedRoute allowedRoles={['customer']}><BrowseProviders /></ProtectedRoute>} />
        <Route path="/customer/requests" element={<ProtectedRoute allowedRoles={['customer']}><MyRequests /></ProtectedRoute>} />
        <Route path="/customer/request-status/:id" element={<ProtectedRoute allowedRoles={['customer']}><RequestStatus /></ProtectedRoute>} />
        <Route path="/customer/payment/:requestId" element={<ProtectedRoute allowedRoles={['customer']}><PaymentCheckout /></ProtectedRoute>} />
        <Route path="/customer/provider/:id" element={<ProtectedRoute allowedRoles={['customer']}><ProviderProfile /></ProtectedRoute>} />
        <Route path="/customer/service-review" element={<ProtectedRoute allowedRoles={['customer']}><Navigate to="/customer/dashboard" replace /></ProtectedRoute>} />
        <Route path="/customer/service-review/:id" element={<ProtectedRoute allowedRoles={['customer']}><ServiceReview /></ProtectedRoute>} />
        <Route path="/customer/settings" element={<ProtectedRoute allowedRoles={['customer']}><Settings /></ProtectedRoute>} />
        <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><Settings /></ProtectedRoute>} />
        <Route path="/customer/saved" element={<ProtectedRoute allowedRoles={['customer']}><SavedProviders /></ProtectedRoute>} />
        <Route path="/customer/invite" element={<ProtectedRoute allowedRoles={['customer']}><InviteFriends /></ProtectedRoute>} />
        <Route path="/customer/job-otp/:jobId" element={<ProtectedRoute allowedRoles={['customer']}><JobOTP /></ProtectedRoute>} />
        <Route path="/customer/confirm/:jobId" element={<ProtectedRoute allowedRoles={['customer']}><ConfirmCompletion /></ProtectedRoute>} />

        {/* Provider Onboarding — redirect to dashboard (KYC handles everything now) */}
        <Route path="/provider/onboarding/*" element={<Navigate to="/provider/dashboard" replace />} />

        {/* Provider Routes — Dashboard is always accessible */}
        <Route path="/provider/dashboard" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><ProviderDashboard /></CategoryGate></ProtectedRoute>} />

        {/* Provider Feature Routes — gated behind KYC */}
        <Route path="/provider/requests" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><Requests /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/requests/:id" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><RequestDetails /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/jobs" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><MyJobs /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/jobs/:id" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><JobDetails /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/negotiation/:id" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><JobDetails /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/earnings" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><Earnings /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/profile" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><MyProfile /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/settings" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><ProviderSettings /></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/settings/password" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><ChangePassword /></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/posts/new" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><CreateServicePost /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/provider/schedule" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><Schedule /></KYCGate></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/invite" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><ProviderInviteFriends /></CategoryGate></ProtectedRoute>} />
        <Route path="/provider/job-start/:jobId" element={<ProtectedRoute allowedRoles={['provider']}><CategoryGate><KYCGate><JobStart /></KYCGate></CategoryGate></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetails />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:id" element={<AdminRequestDetails />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="verifications/:id" element={<AdminVerificationDetails />} />
          <Route path="commission" element={<AdminCommission />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      </AnimatePresence>
      {isCustomerPlatform && <AIChat />}
    </>
  );
}

function App() {
  return (
    <Router>  
      <NetworkStatus />
      <Toaster position="top-right" richColors />
      <DeletedAccountModal />
      <AnimatedRoutes />
    </Router>
  )
}

export default App
