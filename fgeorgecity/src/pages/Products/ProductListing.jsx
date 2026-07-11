import Header from '../../components/Header'
import ProductCatalog from '../../components/ProductCatalog'

export default function ProductListing() {
    return (
        <div className="flex min-h-screen flex-col ">
            <Header />
            <main className="flex-grow px-4 pb-10 pt-24">
                <div className="mx-auto max-w-7xl">
                    <ProductCatalog
                        variant="consumer"
                        title="Marketplace"
                        subtitle="Browse the live product catalog and reach out to farmers when you are ready to order."
                        primaryActionLabel="Open messages"
                        primaryActionTo="/messages"
                        cardActionLabel="Request order"
                        cardActionTo="/messages"
                        emptyMessage="No products have been listed yet."
                    />
                </div>
            </main>
        </div>
    )
}