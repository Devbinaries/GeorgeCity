import { Formik, Form, Field, ErrorMessage } from "formik"
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import * as Yup from "yup"
import Logo from "../../components/Logo"
import { VITE_API_URL } from "../../api/api"

export default function FarmerSignUp() {
  const navigate = useNavigate()
  const [signupError, setSignupError] = useState('')

  const mutation = useMutation({
    mutationFn: (newFarmer) => {
      return fetch(`${VITE_API_URL}/users/signup/farmer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFarmer)
      }).then(resp => {
        if (!resp.ok) throw new Error('Signup failed')
        return resp.json()
      })
    },
    onSuccess: () => {
      navigate('/signin?message=Account created successfully. Please sign in.')
    },
    onError: (error) => {
      setSignupError(error.message || 'Failed to create account. Please try again.')
    }
  })

  const validationSchema = Yup.object({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    username: Yup.string().required("Username is required").min(3, 'Username must be at least 3 characters'),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    phone_number: Yup.string().matches(/^[0-9]{10}$/, "Phone number must be 10 digits").required("Phone number is required"),
    address: Yup.string().required("Address is required"),
    farm_name: Yup.string().required("Farm name is required"),
    farm_location: Yup.string().required("Farm location is required"),
    farm_size: Yup.number().positive("Farm size must be positive").required("Farm size is required"),
    farm_type: Yup.string().required("Farm type is required"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    password_confirm: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required')
  })

  return (
    <div className="flex flex-col min-h-screen bg-indigo-100">
      <main className="flex-grow flex items-center justify-center pt-20">
        <div className="w-full max-w-2xl">
          <Formik
            initialValues={{
              first_name: "",
              last_name: "",
              username: "",
              email: "",
              phone_number: "",
              address: "",
              farm_name: "",
              farm_location: "",
              farm_size: "",
              farm_type: "",
              password: "",
              password_confirm: ""
            }}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              setSignupError('')
              const { password_confirm, ...submitData } = values
              mutation.mutate(submitData, {
                onSettled: () => setSubmitting(false)
              })
            }}
          >
            {({ isSubmitting }) => (
              <Form className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col justify-center items-center mb-4">
                  <Logo />
                  <h2 className="text-xl font-bold mt-4">Farmer Sign Up</h2>
                </div>

                {signupError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                    {signupError}
                  </div>
                )}

                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Field
                      type="text"
                      name="first_name"
                      placeholder="First Name"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="first_name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <Field
                      type="text"
                      name="last_name"
                      placeholder="Last Name"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="last_name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>

                <div>
                  <Field
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <ErrorMessage name="username" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Field
                      type="email"
                      name="email"
                      placeholder="Email"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <Field
                      type="tel"
                      name="phone_number"
                      placeholder="Phone (10 digits)"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="phone_number" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>

                <div>
                  <Field
                    type="text"
                    name="address"
                    placeholder="Address"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <ErrorMessage name="address" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Farm Information */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Farm Information</h3>

                  <div>
                    <Field
                      type="text"
                      name="farm_name"
                      placeholder="Farm Name"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="farm_name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Field
                        type="text"
                        name="farm_location"
                        placeholder="Farm Location"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <ErrorMessage name="farm_location" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <Field
                        type="number"
                        name="farm_size"
                        placeholder="Farm Size (acres)"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <ErrorMessage name="farm_size" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Field
                      type="text"
                      name="farm_type"
                      placeholder="Farm Type (e.g., Vegetable, Grain, Mixed)"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="farm_type" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>

                {/* Password */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div>
                    <Field
                      type="password"
                      name="password"
                      placeholder="Password"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="mt-3">
                    <Field
                      type="password"
                      name="password_confirm"
                      placeholder="Confirm Password"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <ErrorMessage name="password_confirm" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isPending}
                  className="w-full bg-blue-500 text-white py-2 px-4 mt-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting || mutation.isPending ? 'Creating Account...' : 'Sign Up'}
                </button>

                <div className="text-center pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-blue-500 hover:text-blue-700 font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  )
}