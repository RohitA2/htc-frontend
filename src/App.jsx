import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* ===================== Loading Fallback ===================== */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
  </div>
);

/* ===================== Lazy Imports ===================== */
const Layout = lazy(() => import('./components/Layouts/DefaultLayout'));
const SearchPage = lazy(() => import('./components/pages/SearchPage'));
const Company = lazy(() => import('./components/company/Company'));
const BankPage = lazy(() => import('./components/bank/BankPage'));
// const BookingForm = lazy(() => import('./components/booking/BookingForm'));

const Login = lazy(() => import('./components/pages/Login'));
const Register = lazy(() => import('./components/pages/Register'));
const Profile = lazy(() => import('./components/pages/ProfilePage'));
const ChangePassword = lazy(() => import('./components/pages/ChangePasswordPage'));
const BookingList = lazy(() => import('./components/booking/BookingsListPage'));
const ChallanList = lazy(() => import('./components/challan/ChallanList'));
const PartyLedger = lazy(() => import('./components/partyLedger/PartyLedgerPage'))
const VendorLedger = lazy(() => import('./components/vendorLedger/vendorLedgerpage'))

const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

/* ===================== App ===================== */
const App = () => {
  return (
    <Provider store={store}>
      <>
        {/* your routes / layout */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* ===================== Public Routes ===================== */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ===================== Protected Routes ===================== */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<SearchPage />} />
                <Route path="/company" element={<Company />} />
                <Route path="/bank" element={<BankPage />} />
                <Route path="/booking" element={<BookingList />} />
                <Route path="/challan" element={<ChallanList />} />
                <Route path="/booking-list" element={<BookingList />} />
                <Route path="/party-payments" element={<PartyLedger />} />
                <Route path="/vendor-payments" element={<VendorLedger />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/change-password" element={<ChangePassword />} />
              </Route>
            </Route>

            {/* ===================== Fallback ===================== */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </Provider>
  );
};

export default App;
