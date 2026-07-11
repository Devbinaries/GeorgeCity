import { Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {AuthProvider}  from "./hooks/useAuth"
import './App.css'

import HomePage from "./pages/HomePage"
import SignUp from './pages/SignUp'
import ValidateOTP from './pages/ValidateOTP'
import SignIn from './pages/SignIn'
import ConsumerSignUp from './pages/Consumer/ConsumerSignUp'
import DriverSignUp from './pages/Logistics/DriverSignUp'
import FarmerSignUp from './pages/Farmer/FarmerSignUp'
import FarmerListings from './pages/Farmer/Listings'
import CreateProduct from './pages/Products/CreateProduct'
import ProductListing from './pages/Products/ProductListing'
import ProductView from './pages/Products/ProductView'
import Purchase from './pages/Products/Purchase'
import Wallet from './pages/Consumer/Wallet'
import Messages from './pages/Messages'
import PaymentStatus from './pages/PaymentStatus'
import UserProfile from './pages/UserProfile'
import Settings from './components/Settings'

const queryClient = new QueryClient()

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <div className='bg-indigo-100 mt-8'>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify" element={<ValidateOTP />} />
            <Route path="/signup/farmer" element={<FarmerSignUp />} />
            <Route path="/signup/consumer/" element={<ConsumerSignUp />} />
            <Route path="/signup/driver" element={<DriverSignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/farmer/listings" element={<FarmerListings />} />
            <Route path="/farmer/listings/create" element={<CreateProduct />} />
            <Route path="/products/create" element={<CreateProduct />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/products/:productId" element={<ProductView />} />
            <Route path="/products/purchase" element={<Purchase />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/payment/status/:transactionId" element={<PaymentStatus />} />
            <Route path="/payment/status" element={<PaymentStatus />} />
            <Route path="/:username" element={<UserProfile />} />
          </Routes>
        </div>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
