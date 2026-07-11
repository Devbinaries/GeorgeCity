import {Formik,Field,Form} from 'formik'
import * as Yup from 'yup'

export default function ValidateOTP(){
    return(
        <>
            <div className="flex flex-col min-h-screen bg-indigo-100">
                
                <div className="container mx-auto py-8 w-100 h-100">
                    <Formik
                        initialValues={{ otp: '' }}
                        validationSchema={
                            Yup.object({
                                otp: Yup.string()
                                    .required('OTP is required')
                                    .matches(/^\d{6}$/, 'OTP must be a 6-digit number'),
                            })  
                        }
                        onSubmit={(values) => {
                            // Handle OTP validation logic here
                        }}
                    >
                        <Form className="bg-white p-8 rounded-lg shadow-md flex flex-col">
                            <div className="container mx-auto py-8">
                                <h1 className="text-4xl font-bold mb-4">Validate OTP</h1>
                                <p> We sent a 6-digit code to your phone number</p>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="otp" className="block text-gray-700 font-bold mb-2">Enter OTP:</label>
                                <Field type="text" id="otp" name="otp" className="border border-gray-300 p-2 w-full rounded-lg" />
                            </div>
                            <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg  justify-end hover:bg-blue-600 transition duration-300">Validate</button>
                        </Form>
                    </Formik>
                </div>
            </div>
        </>
    )
} 