import {Link} from "react-router-dom"
import {motion} from 'motion/react'

import Header from "../components/Header"
import Footer from "../components/Footer"



export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="mt-3 flex-grow landing-bg text-white p-4">
                <motion.div 
                className="flex flex-col gap-4 center-4 h-full justify--center"
                initial={{opacity:0,y:20}}
                animate={{opacity:1,y:0}}
                transition={{duration:5}}>
                    <div className="mt-20">
                        <h1 className="text-xl font-bold pt-8 lg:text-6xl font-bold">GeorgeCity</h1>
                        <div className='text-lg font-semibold lg:text-3xl font-semibold'>
                            Join a network of 10,000+ farmers and consmers
                            
                        </div>
                    </div>
                    <div className='justify-center mt-8 flex gap-4 justify-items-end'>
                        <Link to="/signup" className="p-2 bg-white animate-bounce rounded-lg text-slate-900 text-center text-lg w-50 h-10 ">
                            Create Free Account
                        </Link>
                    </div>
                </motion.div>
               
            </main>
            <Footer />
        </div>
        
    )
}