import {Link} from 'react-router-dom'
import Logo from "../components/Logo"
import FarmerSignUp from './Farmer/FarmerSignUp'
import ConsumerSignUp from './Consumer/ConsumerSignUp'
import DriverSignUp from './Logistics/DriverSignUp'


export default function SignUp(){
    return(
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow bg-indigo-100 justify-center items-center p-8">
                <div className='flex flex-col gap-4 container m-auto p-8 bg-white center-0 rounded-lg w-150 h-150 shadow-md justify-center items-center'>
                    <Logo />
                    <h1 className='text-xl font-semibold'>Sign Up</h1>
                    <Link to="/signup/farmer" className="bg-blue-500 w-full h-20 rounded-xl text-center pt-6 text-white text-lg hover:bg-blue-600" element={<FarmerSignUp />}>
                        I am a Farmer
                    </Link>
                    <Link to="/signup/consumer" className="bg-green-500 w-full h-20 rounded-xl text-center pt-6 text-white text-lg hover:bg-green-600" element={<ConsumerSignUp />}>
                        I am a Consumer
                    </Link>
                    <Link to="/signup/driver" className="bg-gray-500 w-full h-20 rounded-xl text-center pt-6 text-white text-lg hover:bg-gray-600" element={<DriverSignUp />}>
                        I am a Driver
                    </Link>
                    <div className='items-end'>Already have an account? <Link to="/signin" className='text-blue-500'>SignIn</Link></div>
                </div>
            </main>           
        </div>
    )
}