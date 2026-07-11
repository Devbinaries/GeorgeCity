

export default function Footer(){
    return (
        <footer className="bg-gray-800 text-white grid grid-cols-2 flex items-center px-2 py-2">
            <div>&copy; 2026 George City: A Devbinaries Project</div>
            <div className="grid justify-items-end ">
                <div className="flex gap-4 ">
                    <i className='bi bi-facebook' />
                    <i className='bi bi-twitter' />
                    <i className='bi bi-instagram' />
                    <i className='bi bi-linkedin' />
                </div>
            </div>
        </footer>
    )
}