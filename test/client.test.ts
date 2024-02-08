import { MongoClient } from '../src/index'
import { ObjectId, UUID } from 'mongodb'

describe('MongoClient', () => {
  let client: MongoClient
  let _id: ObjectId
  let uuid: UUID

  beforeEach(() => {
    _id = new ObjectId()
    uuid = new UUID('408ebbdc-2651-4aa4-8298-3aef14e78f7e')

    // Mocking global.fetch
    const mockResponse: any = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        document: {
          _id,
          foo: 'bar',
          uuid
        }
      }),
      text: jest.fn().mockResolvedValue(''),
      headers: new Headers(),
      status: 200,
      statusText: 'OK'
    }

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse)

    client = new MongoClient({
      endpoint: 'https://data.mongodb-api.com/app/data-abc/endpoint/data/v1',
      dataSource: 'dataSource',
      auth: {
        apiKey: 'API_KEY'
      }
    })
  })

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks()
  })

  test('insertOne', async () => {
    await client.database('db-name').collection('c-name').insertOne({
      _id,
      foo: 'bar',
      uuid
    })

    // Assuming the Collection class has a `findOne` method
    const document = await client
      .database('db-name')
      .collection('c-name')
      .findOne({ _id })

    expect(document).toEqual({
      _id,
      foo: 'bar',
      uuid
    })
  })
})
