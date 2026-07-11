import { useState } from "react"
import {Link} from "react-router-dom"
import {UserRound,CirclePoundSterling} from "lucide-react"


import Header from "../../components/Header"
import CreateProduct from '../Products/CreateProduct'

export default function DriverProfile(){
    const [signedIn, setSignedIn] = useState(true)
    if (!signedIn) {
        return (
            <div className="flex flex-col min-h-screen bg-indigo-100">
                <Header />
                <div className="container mt-32 py-8">
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
                                <h1 className="text-4xl font-bold">Your Name</h1>
                                <h6 className="text-md font-semibold">@username</h6>
                                <p className="bg-gray-500 rounded-full h-10 w-auto p-2 text-white text-center"> D E L I V E R Y  A G E N T </p>
                            </div>
                        </div>
                        <div className="mt-8 bg-white">
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
                        </div>
                        <div>
                                <div className='p-4 bg-white rounded-lg shadow-md w-50 h-50 mt-4 flex flex-col items-center justify-center gap-2'>
                                    <div className="rounded-full flex w-30 h-30 bg-green-200 p-auto justify-center items-center"><CirclePoundSterling size={80} color="green" /></div>
                                    <p className="text-green-700 font-semibold text-lg">Wallet</p>
                                </div>
                            </div>
                    </main>
                </div>
            </div>
        </div>
    )
}