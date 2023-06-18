import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import { ethers } from 'ethers'

const Create = ({provider, dao, setIsLoading}) =>
{
    const [name, setName] = useState('')
    const [amount, setAmount] = useState(0)
    const [address, setAddress] = useState('')

    const createHandler = async (event) =>
    {
        event.preventDefault()
        console.log('Creating proposal with args:')
        console.log(name)
        console.log(amount)
        console.log(address)
    }
    return(
        <Form onSubmit={createHandler}>
            <Form.Group style={{ maxWidth: '450px', margin: '50px auto'}}>
                <Form.Control 
                type='text' 
                placeholder='Enter name:' 
                className='my-2'
                onChange={(event) => setName(event.target.value)}
                />
                <Form.Control 
                type='number' 
                placeholder='Enter amount:' 
                className='my-2'
                onChange={(event) => setAmount(event.target.value)}
                />
                <Form.Control 
                type='text' 
                placeholder='Enter address:' 
                className='my-2'
                onChange={(event) => setAddress(event.target.value)}
                />
                <Button variant='primary' type='submit' style={{width: '100%'}}>Create Proposal</Button>
            </Form.Group>
        </Form>
    )
}

export default Create
