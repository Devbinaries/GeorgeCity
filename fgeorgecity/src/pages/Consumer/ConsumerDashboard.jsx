import { useState } from 'react'
import { ShoppingCart,MessageSquare, House,Store } from 'lucide-react'
import Header from '../../components/Header'
import Messages from '../Messages'
import Feed from './Feed'
import ProductCatalog from '../../components/ProductCatalog'

export default function ConsumerDashbord(){
    const [activeTab, setActiveTab] = useState('feed');

    function renderContent(){
        switch(activeTab){
            case 'feed':
                return (
                    <div className='p-4 m-4' data-feed='feed' id="feed">
                        <h1 className='text-2xl font-bold text-gray-800'>MyFeed</h1>
                        <Feed/>
                    </div>
                )
            case 'marketplace':
            return (
                <div className='p-4' data-orders="orders" id="orders">
                    <ProductCatalog
                        variant="consumer"
                        title="Marketplace"
                        subtitle="Browse fresh produce from local farmers, filter what is live, and request an order when you find the right item."
                        primaryActionLabel="Open messages"
                        primaryActionTo="/messages"
                        cardActionLabel="Request order"
                        cardActionTo="/messages"
                        emptyMessage="No products are available yet."
                    />
                </div>
            );

            case 'orders':
                return (
                    <div className='p-4' data-orders="orders" id="orders">
                        <h1 className='text-2xl font-bold text-gray-800'>Orders</h1>
                        <p className='text-gray-600'>Here you can view your orders.</p>
                    </div>
                );
            case 'messages':
                return (
                    <div className='p-4' data-messages="messages" id="messages">
                        <h1 className='text-2xl font-bold text-gray-800'>Messages</h1>
                        <div><Messages /></div>
                        {/* <p className='text-gray-600'>Here you can view your messages.</p> */}
                    </div>
                );
            case 'hire':
                return (
                    <div className='p-4' data-hire="hire" id="hire">
                        <h1 className='text-2xl font-bold text-gray-800'>Hire</h1>
                        <p className='text-gray-600'>Here you can hire workers for your farm.</p>
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
        <div className="flex flex-col min-h-screen bg-indigo-100">
          <main className="flex-grow pt-8">
                <Header />
                <div className="w-full ">
                    <nav className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center  fixed w-full">
                        <button className='flex flex-row' onClick={() => setActiveTab("feed")}><House />My Feed</button>
                        <button className="flex flex-row" onClick={() => setActiveTab("marketplace")}><Store />Marketplace</button>
                        <button className="flex flex-row" onClick={() => setActiveTab("orders")}><ShoppingCart />Orders</button>
                        <button className="flex flex-row py-4" onClick={() => setActiveTab("messages")}><MessageSquare />Messages</button>
                    </nav>
                </div>
                <div className="container mx-4 p-4 bg-white rounded-t-lg mt-32 h-auto w-full   h-full overflow-hidden"> 
                    {renderContent()}
                </div>           
          </main>
        </div>
    )
}