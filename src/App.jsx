import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineWave } from 'react-loader-spinner';

/* ===================== Loading Fallback ===================== */
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    {/* Logo */}
    <div className="mb-8">
      <img
        src="/images/Trucking-logo.jpeg"
        alt="Trucking Logo"
        className="h-50 w-100 object-contain rounded-lg shadow-md"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/128x128?text=Trucking+Logo";
        }}
      />
    </div>

    {/* App Name */}
    {/* <h1 className="text-3xl font-bold text-gray-800 mb-4">Trucking System</h1> */}

    {/* Infinity Spin Loader */}
    <div className="mt-4">
      <LineWave
        visible={true}
        height="100"
        width="100"
        color="#4fa94d"
        ariaLabel="line-wave-loading"
        wrapperStyle={{}}
        wrapperClass=""
        firstLineColor=""
        middleLineColor=""
        lastLineColor=""
      />
    </div>

    {/* Loading Text */}
    <p className="mt-6 text-gray-600 text-lg font-medium">
      Loading your dashboard...
    </p>
  </div>
);

/* ===================== Lazy Imports ===================== */
const Layout = lazy(() => import('./components/Layouts/DefaultLayout'));
const SearchPage = lazy(() => import('./components/pages/SearchPage'));
const Company = lazy(() => import('./components/company/Company'));
const BankPage = lazy(() => import('./components/bank/BankPage'));
const Login = lazy(() => import('./components/pages/Login'));
const Register = lazy(() => import('./components/pages/Register'));
const Profile = lazy(() => import('./components/pages/ProfilePage'));
const ChangePassword = lazy(() => import('./components/pages/ChangePasswordPage'));
const BookingList = lazy(() => import('./components/booking/BookingsListPage'));
const ChallanList = lazy(() => import('./components/challan/ChallanList'));
const PartyLedger = lazy(() => import('./components/partyLedger/PartyPayments'));
const VendorLedger = lazy(() => import('./components/vendorLedger/VendorPayments'));
const PartyTransactions = lazy(() => import('./components/partyLedger/PartyTransactions'))
const VendorTransactions = lazy(() => import('./components/vendorLedger/VendorTransactions'))
const DayBook = lazy(() => import('./components/accounting/DayBook'));
const TrailBalance = lazy(() => import('./components/accounting/TrailBalance'));
const BalanceSheet = lazy(() => import('./components/accounting/BalanceSheet'));
const CommissionLedger = lazy(() => import('./components/commission/CommissionLedger'));
const Halting = lazy(() => import('./components/haltings/Halting'));


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
            {/* <Route element={<ProtectedRoute />}> */}
            <Route element={<Layout />}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/company" element={<Company />} />
              <Route path="/bank" element={<BankPage />} />
              <Route path="/booking" element={<BookingList />} />
              <Route path="/challan" element={<ChallanList />} />
              <Route path="/party-payments" element={<PartyLedger />} />
              <Route path="/vendor-payments" element={<VendorLedger />} />
              <Route path="/party-transactions" element={<PartyTransactions />} />
              <Route path="/vendor-transactions" element={<VendorTransactions />} />
              <Route path="/halting" element={<Halting />} />
              <Route path="/daybook" element={<DayBook />} />
              <Route path="/trail-balance" element={<TrailBalance />} />
              <Route path="/balance-sheet" element={<BalanceSheet />} />
              <Route path="/commission-ledger" element={<CommissionLedger />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>
            {/* </Route> */}

            {/* ===================== Fallback ===================== */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </Provider>
  );
};

export default App;
