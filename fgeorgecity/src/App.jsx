import { Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {AuthProvider}  from "./hooks/useAuth"
import './App.css'

import Header from './components/Header'
import LandingPage from "./pages/LandingPage"
import SignUp from './pages/SignUp'
import ValidateOTP from './pages/ValidateOTP'
import SignIn from './pages/SignIn'
import ConsumerSignUp from './pages/Consumer/ConsumerSignUp'
import DriverSignUp from './pages/Logistics/DriverSignUp'
import FarmerSignUp from './pages/Farmer/FarmerSignUp'
import FarmerDashboard from "./pages/farmer/FarmerDashboard"
import FarmerProfile from "./pages/Farmer/FarmerProfile"
import FarmerListings from './pages/Farmer/Listings'
import ConsumerProfile from "./pages/Consumer/ConsumerProfile"
import ConsumerDashboard from './pages/Consumer/ConsumerDashboard'
import CreateProduct from './pages/Products/CreateProduct'
import ProductListing from './pages/Products/ProductListing'
import Purchase from './pages/Products/Purchase'
import DriverDashboard from './pages/Logistics/DriverDashboard'
import DriverProfile from './pages/Logistics/DriverProfile'
import Wallet from './pages/Consumer/Wallet'
import Messages from './pages/Messages'
import PaymentStatus from './pages/PaymentStatus'

const queryClient = new QueryClient()

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <div className='bg-indigo-100 mt-8'>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify" element={<ValidateOTP />} />
            <Route path="/signup/farmer" element={<FarmerSignUp />} />
            <Route path="/signup/consumer/" element={<ConsumerSignUp />} />
            <Route path="/signup/driver" element={<DriverSignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
            <Route path="/profile/farmer/:username" element={<FarmerProfile />} />
            <Route path="/profile/farmer" element={<FarmerProfile />} />
            <Route path="/farmer/listings" element={<FarmerListings />} />
            <Route path="/farmer/listings/create" element={<CreateProduct />} />
            <Route path="/profile/consumer/:username" element={<ConsumerProfile />} />
            <Route path="/profile/consumer" element={<ConsumerProfile />} />
            <Route path="/dashboard/consumer" element={<ConsumerDashboard />} />
            <Route path="/products/create" element={<CreateProduct />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/products/purchase" element={<Purchase />} />
            <Route path="dashboard/driver" element={<DriverDashboard />} />
            <Route path="/profile/driver/:username" element={<DriverProfile />} />
            <Route path="/profile/driver" element={<DriverProfile />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/payment/status/:transactionId" element={<PaymentStatus />} />
            <Route path="/payment/status" element={<PaymentStatus />} />
          </Routes>
        </div>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
