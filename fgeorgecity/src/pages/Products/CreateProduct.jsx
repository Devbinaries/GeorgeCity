import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom'
import {Formik, Field, Form, ErrorMessage} from 'formik'
import * as Yup from 'yup'

import Header from '../../components/Header'
import { useAuth } from '../../hooks/useAuth'

const validationSchema = Yup.object().shape({
    product: Yup.string().required('Product name is required'),
    description: Yup.string().required('Description is required'),
    quntity: Yup.number().required('Quantity is required').positive('Quantity must be a positive number'),
    category: Yup.string().required('Category is required'),
});

const CATEGORY_OPTIONS = ['fruits', 'vegetables', 'crops', 'livestock', 'dairy', 'poultry']

export default function CreateProduct(){
    const navigate = useNavigate()
    const { user } = useAuth();
    const [submitError, setSubmitError] = useState('')
    const queryClient = useQueryClient();
    
    const createProduct = useMutation({
        mutationFn: async function(productData){
            const response = await fetch('/api/marketplace/products/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.detail ?? 'Unable to create product listing.');
            }

            return payload;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/farmer/listings');
        },
        onError: (error) => {
            setSubmitError(error.message ?? 'Unable to create product listing.');
        }
    });

    return(
        <div className="flex flex-col min-h-screen bg-indigo-100">
            <main>
                <Header/>
                <div className="container mx-auto my-auto mt-16 p-8">
                    <Formik
                        initialValues={{
                            product: '',
                            description: '',
                            quntity: '',
                            category: CATEGORY_OPTIONS[0],
                        }}
                        validationSchema={validationSchema}
                        onSubmit={(values) => {
                            if (!user?.id) {
                                setSubmitError('You must be logged in as a farmer to create product listings.');
                                return;
                            }
                            setSubmitError('')
                            createProduct.mutate({
                                product: values.product.trim(),
                                description: values.description.trim(),
                                quntity: Number(values.quntity),
                                category: values.category,
                                farmer: Number(user.id),
                                in_stock: Number(values.quntity) > 0,
                            })
                        }}
                    >
                        {({ isSubmitting }) => (
                            <Form className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                                <h1 className="mb-4 text-4xl font-bold">Create Product</h1>
                                <p className="mb-6 text-sm text-gray-500">This form saves directly to the marketplace product model under your farmer profile.</p>
                                {submitError && (
                                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {submitError}
                                    </div>
                                )}
                                <div className="mb-4">
                                    <label htmlFor="product" className="block font-bold text-gray-700 mb-2">Product name:</label>
                                    <Field type="text" id="product" name="product" className="w-full rounded-lg border border-gray-300 p-2" />
                                    <ErrorMessage name="product" component="div" className="text-red-500" />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="description" className="block font-bold text-gray-700 mb-2" >Description:</label>
                                    <Field as="textarea" id="description" name="description" className="w-full rounded-lg border border-gray-300 p-2" rows="4" />
                                    <ErrorMessage name="description" component="div" className="text-red-500" />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="quntity" className="block font-bold text-gray-700 mb-2">Quantity:</label>
                                    <Field type="number" id="quntity" name="quntity" className="w-full rounded-lg border border-gray-300 p-2" min="1" />
                                    <ErrorMessage name="quntity" component="div" className="text-red-500" />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="category" className="block font-bold text-gray-700 mb-2">Category:</label>
                                    <Field as="select" id="category" name="category" className="w-full rounded-lg border border-gray-300 p-2">
                                        {CATEGORY_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="category" component="div" className="text-red-500" />
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="rounded-lg bg-blue-500 p-2 text-white transition duration-300 hover:bg-blue-600 font-semibold" disabled={isSubmitting || createProduct.isPending}>
                                        Create Product
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </main>
        </div>
    )       
}