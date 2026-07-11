import { useState } from "react"
import {useQuery} from '@tanstack/react-query'
import {Link, useParams} from "react-router-dom"
import {UserRound,CirclePoundSterling,Settings, FileText, Wallet} from "lucide-react"

import Header from "../../components/Header"
import CreateProduct from '../Products/CreateProduct'
import ProducListing from '../Products/ProductListing'

export default function Profile(){
    const { username } = useParams()
    const [signedIn, setSignedIn] = useState(true)
    const {error,data,isSignedIn}= useQuery({
        queryKey: ['farmer',username],
        queryFn : () => fetch(`/api/users/farmers/${username}/`).then(resp => resp.json()),
        enabled : !!username && signedIn
    });
    
    if (!signedIn) {
        return (
            <div className="flex flex-col min-h-screen h-full items-center bg-indigo-100">
                <Header />
                <div className="container mx-auto py-8">
                    <p>Please sign in to view your profile.</p>
                </div>
            </div>
        )
    }
    
    return(
        <div className="flex flex-col min-h-screen bg-indigo-100">
            <Header />
            <div className="container mx-auto py-8 ">
                <div>
                    <main>
                        <div className="p-8 bg-white rounded-xl mt-8 h-50 flex items-center gap-4">
                            <div className='rounded-full bg-gray-500  w-32 h-32 flex items-center justify-center'><UserRound size={100} color="white"/></div>
                            <div>
                                <h1 className="text-4xl font-bold">{data?.first_name || data?.name || 'Your Name'} {data?.last_name || ''}</h1>
                                <h6 className="text-md font-semibold">@{data?.username || username || 'username'}</h6>
                                <p className="bg-green-500 rounded-full h-10 w-auto p-2 text-white text-center"> F A R M E R</p>
                            </div>
                        </div>
                        
                            
                            <div className ='flex flex-wrap gap-4 mx-4 my-2'>
                                <Link to="/wallet" element={<Wallet />} >
                                    <div className='p-4 bg-white rounded-lg shadow-md w-50 h-50 mt-4 flex flex-col items-center justify-center gap-2'>
                                        <div className="rounded-full flex w-30 h-30 bg-green-200 p-auto justify-center items-center"><CirclePoundSterling size={80} color="green" /></div>
                                        <p className="text-green-700 font-semibold text-lg">Wallet</p>
                                    </div>
                                </Link>
                                <Link to="/settings" element={<Settings />} >
                                    <div className='p-4 bg-white rounded-lg shadow-md w-50 h-50 mt-4 flex flex-col items-center justify-center gap-2'>
                                        <div className="rounded-full flex w-30 h-30 bg-blue-200 p-auto justify-center items-center"><Settings size={80} color="blue" /></div>
                                        <p className="text-blue-700 font-semibold text-lg">Settings</p>
                                    </div>
                                </Link>
                                <Link to="/listings" element={<Listings />} >
                                    <div className='p-4 bg-white rounded-lg shadow-md w-50 h-50 mt-4 flex flex-col items-center justify-center gap-2'>
                                        <div className="rounded-full flex w-30 h-30 bg-amber-200 p-auto justify-center items-center"><FileText size={80} color="#b45309" /></div>
                                        <p className="text-amber-700 font-semibold text-lg">My Listings</p>
                                    </div>
                                </Link>
                            </div>
                        
                    </main>
                </div>
            </div>
        </div>
    )
}