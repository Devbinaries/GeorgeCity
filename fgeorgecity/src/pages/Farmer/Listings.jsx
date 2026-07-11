import { Link } from 'react-router-dom'

import Header from '../../components/Header'
import ProductCatalog from '../../components/ProductCatalog'

export default function Listings(){
    return(
        <div className='flex min-h-screen flex-col bg-indigo-100'>
            <Header />
            <main className='flex-grow px-4 pb-10 pt-24'>
                <div className='mx-auto max-w-7xl space-y-6'>
                    <div className='flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between'>
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600'>Farmer listings</p>
                            <h1 className='mt-2 text-3xl font-black text-slate-900'>Manage your products</h1>
                            <p className='mt-2 max-w-2xl text-sm text-slate-500'>
                                Keep your catalog ready for buyers, update stock information, and create new listings when harvest comes in.
                            </p>
                        </div>

                        <Link
                            to="/farmer/listings/create"
                            className='inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700'
                        >
                            Create listing
                        </Link>
                    </div>

                    <ProductCatalog
                        variant="farmer"
                        title="Current listings"
                        subtitle="These are the products visible to consumers right now."
                        primaryActionLabel="Create listing"
                        primaryActionTo="/farmer/listings/create"
                        cardActionLabel="Edit listing"
                        cardActionTo="/farmer/listings/create"
                        emptyMessage="You do not have any live products yet."
                    />
                </div>
            </main>
        </div>
    )
}