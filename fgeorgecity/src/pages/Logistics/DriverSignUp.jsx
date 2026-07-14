import { Formik, Form, Field, ErrorMessage } from "formik"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import * as Yup from "yup"
import Logo from "../../components/Logo"
import { VITE_API_URL } from "../../api/api"

export default function DriverSignUp() {
  const navigate = useNavigate()
  const [signupError, setSignupError] = useState('')

  const mutation = useMutation({
    mutationFn: (newDriver) => {
      return fetch(`${VITE_API_URL}/users/signup/driver/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newDriver)
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
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    password_confirm: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required')
  })

  return (
    <div className="flex flex-col min-h-screen bg-indigo-100">
      <main className="flex-grow flex items-center justify-center pt-20">
        <div className="w-full max-w-md">
          <Formik
            initialValues={{
              first_name: "",
              last_name: "",
              username: "",
              email: "",
              phone_number: "",
              address: "",
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
                  <h2 className="text-xl font-bold mt-4">Driver Sign Up</h2>
                </div>

                {signupError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                    {signupError}
                  </div>
                )}

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

                <div>
                  <Field
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <Field
                    type="password"
                    name="password_confirm"
                    placeholder="Confirm Password"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <ErrorMessage name="password_confirm" component="div" className="text-red-500 text-xs mt-1" />
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