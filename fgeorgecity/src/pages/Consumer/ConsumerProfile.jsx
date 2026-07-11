import { useState } from "react"
import {useQuery} from '@tanstack/react-query'
import {useParams,Link} from "react-router-dom"
import {UserRound,CirclePoundSterling, Settings} from "lucide-react"


import Header from "../../components/Header"
import Feed from "./Feed"

export default function ConsumerProfile(){
    const { username } = useParams()
    const [signedIn, setSignedIn] = useState(true)
    const {error,data,isSignedIn} = useQuery({
        queryKey : ['Consumer',username],
        queryFn : () => fetch(`/api/users/consumers/${username}/`).then(resp  => resp.json()),
        enabled : !!username && signedIn
    })
    
    if (!signedIn) {
        return (
            <div className="flex flex-col min-h-screen bg-indigo-100">
                <Header />
                <div className="container mx-auto py-8 mt-16">
                    <p>Please sign in to view your profile.</p>
                </div>
            </div>
        )
    }
    
    const consumersList = data ? (Array.isArray(data) ? data : [data]) : [];
    
    return(
        <div className="flex flex-col min-h-screen bg-indigo-100 overflow-x-hidden">
            <Header />
            <div className="container mx-auto py-8 ">
                <div>
                    <main>
                        <div className="p-8 bg-white rounded-xl mt-8 h-50 flex items-center gap-4">
                            {consumersList.map((consumer) => (
                                <div key={consumer.id || consumer.username} className="flex items-center gap-4">
                                    <div className='rounded-full bg-gray-500  w-32 h-32 flex items-center justify-center'><UserRound size={100} color="white"/></div>
                                    <div>
                                        <h1 className="text-4xl font-bold">{consumer.first_name || consumer.name || 'Your Name'} {consumer.last_name || ''}</h1>
                                        <h6 className="text-md font-semibold">@{consumer.username || 'username'}</h6>
                                        <p className="bg-blue-500 rounded-full h-10 w-auto p-2 text-white text-center"> C O N S U M E R</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* <div className="mt-8 bg-white">
                            <nav className="flex gap-4">
                                <div>Bio</div> 
                                <div> My Listings</div>
                                <div> Posts </div>

                            </nav>
                            <div className="mt-4 p-4">
                                <p>Bio: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut aliquam tincidunt, nunc nisl aliquam nisl, eget aliquam nunc nisl eget nunc.</p>
                            </div>
                            <div>
                                <Link to="products/create/" element={<CreateProduct />} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300">Create Product</Link>
                            </div>
                            
                        </div> */}
                        <div className ='flex flex-wrap gap-4 mx-4 my-2'>
                            <div className='p-4 bg-white rounded-lg shadow-md w-50 h-50 mt-4 flex flex-col items-center justify-center gap-2'>
                                <div className="rounded-full flex w-30 h-30 bg-green-200 p-auto justify-center items-center"><CirclePoundSterling size={80} color="green" /></div>
                                <p className="text-green-700 font-semibold text-lg">Wallet</p>
                            </div>
                            <div className='p-4 bg-white rounded-lg shadow-md w-50 h-50 mt-4 flex flex-col items-center justify-center gap-2'>
                                <div className="rounded-full flex w-30 h-30 bg-blue-200 p-auto justify-center items-center"><Settings size={80} color="blue" /></div>
                                <p className="text-blue-700 font-semibold text-lg">Settings</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}