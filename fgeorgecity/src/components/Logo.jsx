import {Link} from 'react-router-dom'
import logo from './../assets/logo.png'

export default function Logo(){
    return (
        <Link to="/">
            <div className="flex font-bold text-3xl items-center ">
                <img src={logo} className="w-16 h-16 mr-2" />
                <h1 className='container text-bold text-green-500 text-lg'>George <span className='text-teal-500'>City</span></h1>
            </div>
        </Link>
    )
}