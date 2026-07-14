import { Link, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import * as Yup from 'yup'
import Logo from '../components/Logo'
import  {useAuth}   from '../hooks/useAuth'
import {VITE_API_URL} from '../api/api'


export default function SignIn() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { login } = useAuth()
  const [loginError, setLoginError] = useState('')

  async function loginUser({ username, password }) {
    const response = await fetch(`${VITE_API_URL}/users/signin/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) {
      throw new Error('Login failed')
    }
    return response.json()
  }

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const authState = {
        username: data.username,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        photo: data.photo,
        userType: data.user_type,
        user_type: data.user_type,
      }

      login(
        { access: data.access, refresh: data.refresh },
        authState,
      )

      queryClient.invalidateQueries({ queryKey: ['profile'] })
      
      // Route to appropriate dashboard
      navigate('/')
    },
    onError: () => {
      setLoginError('Invalid username or password')
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-indigo-100">
      <main className="flex-grow flex items-center justify-center ">
        <div className="w-full max-w-md">
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={Yup.object({
              username: Yup.string().required('Username is required'),
              password: Yup.string().required('Password is required')
            })}
            onSubmit={(values) => {
              setLoginError('')
              loginMutation.mutate(values)
            }}
          >
            <Form className="flex flex-col gap-4 bg-white p-8 rounded-lg shadow-md">
              <div className="flex flex-col justify-center items-center mb-4">
                <Logo />
                <p className="text-lg font-semibold mt-4">Sign In</p>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                  {loginError}
                </div>
              )}

              <div>
                <Field
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="username" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <Field
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-500 text-white py-2 px-4 mt-6 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-500 hover:text-blue-700 font-medium">
                    Sign Up
                  </Link>
                </p>
              </div>
            </Form>
          </Formik>
        </div>
      </main>
    </div>
  )
}