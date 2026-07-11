import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../hooks/useAuth"
import FarmerProfile from "./Farmer/FarmerProfile"
import ConsumerProfile from "./Consumer/ConsumerProfile"
import DriverProfile from "./Logistics/DriverProfile"
import Header from "../components/Header"

export default function UserProfile() {
    const { username } = useParams()
    const { user: authUser, getAuthToken } = useAuth()

    const targetUsername = username || authUser?.username

    const { data, isLoading, error } = useQuery({
        queryKey: ['user-type', targetUsername],
        queryFn: async () => {
            if (!targetUsername) return null
            const token = getAuthToken()
            const response = await fetch(`/api/users/by-username/${targetUsername}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) {
                throw new Error('User not found')
            }
            return response.json()
        },
        enabled: !!targetUsername
    })

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-indigo-100">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-lg font-semibold text-indigo-900">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex flex-col min-h-screen bg-indigo-100">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-lg font-semibold text-red-600">User profile not found</p>
                </div>
            </div>
        )
    }

    const userType = data.user_type
    if (userType === 'farmer') {
        return <FarmerProfile />
    } else if (userType === 'driver') {
        return <DriverProfile />
    } else {
        return <ConsumerProfile />
    }
}
