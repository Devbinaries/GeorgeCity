import {Formik, Form, Field} from 'formik';
import {useQuery} from '@tanstack/react-query';
import {VITE_API_URL} from '../api/api';
import {Search} from 'lucide-react';

export default function Search() {
    const {data, isLoading, error} = useQuery({
        queryKey: ['search'], 
        queryFn: async () => {
            const response = await fetch(`${VITE_API_URL}/users/farmer/search/?search=`);
            return response.json();
    }});
    
    return (
        <Formik
            initialValues={{ search: '' }}
            onSubmit={(values) => {
                // Handle search submission
                return data.values
            }}
        >
            {() => (
                <Form>
                    <Field name="search" placeholder="Search..." className='rounded-lg bg-white border border-gray-200 bi bi-search'/>
                </Form>
            )}
        </Formik>
    );
}