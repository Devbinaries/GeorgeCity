import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {House, ShoppingCart, MessageSquare, FileUser, PlusCircle} from 'lucide-react'
import Header from '../../components/Header'
import ProductListing from '../Products/ProductListing'
import Messages from './../Messages'
import HireTab from './HireTab'
import ListingsTab from './ListingsTab'
import { fetchProfile } from '../../api/login'


export default function FarmerDashbord(){
    const [activeTab, setActiveTab] = useState('feed');
    const [farmerProfile, setFarmerProfile] = useState(null);

    useEffect(() => {
        fetchProfile().then((data) => {
            if (data && !data.error) setFarmerProfile(data);
        });
    }, []);


    function renderContent(){
        switch(activeTab){
            case 'feed':
                return (
                    <div className='p-4 h-auto' data-feed='feed' id="feed">
                        <h1 className='text-2xl font-bold text-gray-800'>My Feed</h1>
                        <p className='text-gray-600'>Keep an eye on your listings, orders, and recent activity.</p>
                        <div className='mt-4 flex flex-wrap gap-3'>
                            <button onClick={() => setActiveTab('listings')} className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'>
                                <ShoppingCart size={16} />
                                View listings
                            </button>
                            <button onClick={() => setActiveTab('listings')} className='inline-flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50'>
                                <PlusCircle size={16} />
                                Create listing
                            </button>
                        </div>
                    </div>
                )
            case 'listings':
                return (
                    <div className='p-4' data-listings="listings" id="listings">
                        <ListingsTab />
                    </div>
                );
            case 'messages':
                return (
                    <div className='p-4' data-messages="messages" id="messages">
                        <h1 className='text-2xl font-bold text-gray-800'>Messages</h1>
                        <p className='text-gray-600'>Here you can view your messages.</p>
                        <div className='mt-4'>
                            <Messages />
                        </div>
                    </div>
                );
            case 'hire':
                return (
                    <div className='p-4' data-hire="hire" id="hire">
                        <HireTab farmerProfile={farmerProfile} />
                    </div>
                );
            case 'orders':
                return (
                    <div className='p-4' data-orders="orders" id="orders">
                        <h1 className='text-2xl font-bold text-gray-800'>Orders</h1>
                        <p className='text-gray-600'>Here you can view your orders.</p>
                    </div>
                );
            default:
                return null;
        }
    }
    return(
        <div className="flex flex-col min-h-screen bg-indigo-100 ">
          <Header />
          <main className="flex pt-16">
                 <div className="flex flex-col ">
                    <div className="w-full">
                        <nav className="bg-white p-4 rounded-lg shadow-md fixed top-16 left-0 right-0 z-40 flex justify-between items-center w-full">
                            <button className='flex flex-col' onClick={() => setActiveTab("feed")}><House />My Feed</button>
                            <button className="flex flex-col" onClick={() => setActiveTab("listings")}><ShoppingCart />Listings</button>
                            <button className="flex flex-col" onClick={() => setActiveTab("hire")}><FileUser />Hire</button>
                            <button className="flex flex-col py-4" onClick={() => setActiveTab("messages")}><MessageSquare />Messages</button>
                        </nav>
                    </div>
                    <div className="p-4 bg-white rounded-t-lg mt-36  mx-4 my-4 h-full w-full"> 
                        {renderContent()}
                    </div>
                </div>                 
          </main>
        </div>
    )
}