import { Outlet } from 'react-router-dom'

export default function MainLayout() {
    return (
        <>
            <header>
                hi
            </header>
            <main>
                <Outlet />
            </main>
        </>
    )
}
