import React, { useState } from 'react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {axiosInstance} from '../../lib/axios.js'
import toast from 'react-hot-toast'
import {Loader} from 'lucide-react'


const SignUpForm = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

	const queryClient = useQueryClient()

    const {mutate : SignUpMutation, isLoading} = useMutation({
        mutationFn: async(data)=>{
            const res = await axiosInstance.post('/auth/signup', data)
            return res.data
        },
        onSuccess:()=>{toast.success('Account Created Sucessfully')
			queryClient.invalidateQueries({queryKey: ['authUser']})
		},
        onError: (error)=>{toast.error(error.response.data.message || 'Something Went Wrong')}
    })
    const handleSignup = (e)=>{
        e.preventDefault()
        SignUpMutation({name, email, username, password})
    }
  return (
    <form onSubmit={handleSignup} className='flex flex-col gap-4'>
      <input
				type='text'
				placeholder='Full name'
				value={name}
				onChange={(e) => setName(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='text'
				placeholder='Username'
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='email'
				placeholder='Email'
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='password'
				placeholder='Password (6+ characters)'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className='input input-bordered w-full'
				required
			/>

            <button type='submit'
            disabled={isLoading}
            className='btn btn-primary w-full text-white'>
                {isLoading ? <Loader className='size-5 animate-spin'/> : 'Agree & SignUp'}
            </button>

    </form>
  )
}

export default SignUpForm
