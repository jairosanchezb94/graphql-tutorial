import { ApolloServer, gql, UserInputError } from 'apollo-server';
import { v1 as uuid } from 'uuid';
import axios from 'axios';

const persons = [
    {   
        name: 'John',
        street: '123 Main St.',
        city: 'New York', 
        age: 21,
        phone: '123-456-7890',
        id: '1'
    },
    { 
        name: 'Peter',
        street: '123 Main St.',
        city: 'New York',
        age: 31,
        phone: '123-456-7890',
        id: '2'
    },
    { 
        name: 'Mark', 
        street: '123 Main St.',
        city: 'New York',
        age: 41,
        phone: '123-456-7890',
        id: '3'
    },
    { 
        name: 'Maria', 
        street: '123 Main St.',
        age: 21,
        city: 'New York',
        phone: '',
        id: '4' 
    },
]

const typeDefinitins = gql`
    enum YesNo {
        YES
        NO
    }

    type Address {
        street: String!
        city: String!
    }

    type Person {
        name: String!
        age: Int
        phone: String!
        id: ID!
        address: Address! 
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person!]!
        findPerson(name: String!): Person
    }

    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
        editNumber(
            name: String!
            phone: String!
        ): Person
    }
`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons')

            if (!args.phone) return personsFromRestApi
            
            const byPhone = (person) =>
                args.phone === 'YES' ? person.phone : !person.phone
                
            return personsFromRestApi.filter(byPhone)
        }, 
        findPerson: (root, args) => {
            const { name } = args
            return persons.find(person => person.name === name)
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(person => person.name === args.name)) {
                throw new UserInputError('Person already exists', {
                    invalidArgs: args.name
                })
            }
            // const { name, phone, street, city } = args
            const person = { ...args, id: uuid() }
            persons.push(person) // add to persons array
            return person
        },
        editNumber: (root, args) => {
            const personIndex = persons.find(p => p.name === args.name)
            if (personIndex === -1) return null

            const person = persons[personIndex] 
            const updatedPerson = { ...person, phone: args.phone }
            persons[personIndex] = updatedPerson // update persons array

            return updatedPerson
        }
    },
    Person : {
        address: (root) => {
            return {
                street: root.street,
                city: root.city
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs: typeDefinitins,
    resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})  