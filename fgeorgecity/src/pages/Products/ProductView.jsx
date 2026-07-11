import {useParams} from "react-router-dom"

export default function ProductView(){
    const {productId} = useParams()
    return(
        <div className=" flex flex-col min-h-screen bg-indigo-100">
            <Header />
            <main className="container flex-grow m-8 bg-white p-4 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Purchase Product</h1>
                <p>Welcome to the Purchase page. Here you can view and manage your purchases.</p>
                <div className='container p-6 flex gap-4 rounded-lg shadow-lg w-200 sm: w-100 '>
                    <div className='rounded-lg shadow-md p-4 w-100 h-100'>
                        {/* product image */}
                    </div>
                    <div className='flex flex-col gap-4 w-100'>
                        <h2 className='text-xl font-semibold'>Product Name</h2>
                        <p className='text-gray-600'>Product Description</p>
                        <p className='text-gray-800 font-bold'>$Price</p>
                        <button className='bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600'>Buy Me</button>
                    </div>
                </div>
                {/* reviews */}
                <div className='mt-8'>
                    <h2 className='text-xl font-semibold mb-4'>Reviews</h2>
                    <div className='flex flex-col gap-4'>
                        <div className='bg-gray-100 p-4 rounded-lg shadow-md'>
                            <p className='text-gray-700'>This is a great product!</p>
                            <p className='text-sm text-gray-500'>- John Doe</p>
                        </div>
                        
                    </div>
                </div>
            </main>
        </div>
    )
}