export default  function Dashboard(){
    return(
        <div className="flex flex-col min-h-screen bg-indigo-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>
            </header>
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Deliver</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your deliveries.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}