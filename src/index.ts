import type { Document } from 'mongodb'

export interface EmailPasswordAuthOptions {
  email: string
  password: string
}

export interface ApiKeyAuthOptions {
  apiKey: string
}

export interface CustomJwtAuthOptions {
  jwtTokenString: string
}

export type Documents = {
  documents: Document[]
}

export type InsertOneResult = {
  insertedId: string
}

export type InsertManyResult = {
  insertedIds: string[]
}

export type UpdateResult = {
  matchedCount: number
  modifiedCount: number
  upsertedId?: string
}

export type DeleteResult = { deletedCount: number }

export type AuthOptions =
  | EmailPasswordAuthOptions
  | ApiKeyAuthOptions
  | CustomJwtAuthOptions

export interface MongoClientConstructorOptions {
  dataSource: string
  auth: AuthOptions
  endpoint: string
}

export class MongoClient {
  dataSource: string
  endpoint: string
  fetch = fetch
  headers = new Headers()

  constructor({ dataSource, auth, endpoint }: MongoClientConstructorOptions) {
    this.dataSource = dataSource
    this.endpoint = endpoint

    this.headers.set('Content-Type', 'application/json')
    this.headers.set('Accept', 'application/json')

    if ('apiKey' in auth) {
      this.headers.set('api-key', auth.apiKey)
      return
    }

    if ('jwtTokenString' in auth) {
      this.headers.set('jwtTokenString', auth.jwtTokenString)
      return
    }

    if ('email' in auth && 'password' in auth) {
      this.headers.set('email', auth.email)
      this.headers.set('password', auth.password)
      return
    }

    throw new Error('Invalid auth options')
  }

  database(name: string) {
    return new Database(name, this)
  }
}

export class Database {
  name: string
  client: MongoClient

  constructor(name: string, client: MongoClient) {
    this.name = name
    this.client = client
  }

  collection(name: string) {
    return new Collection(name, this)
  }
}

export class Collection {
  name: string
  database: Database
  client: MongoClient

  constructor(name: string, database: Database) {
    this.name = name
    this.database = database
    this.client = database.client
  }

  insertOne(doc: Document): Promise<InsertOneResult> {
    return this.callApi<InsertOneResult>('insertOne', { document: doc })
  }

  insertMany(docs: Document[]): Promise<InsertManyResult> {
    return this.callApi<InsertManyResult>('insertMany', { documents: docs })
  }

  async findOne<T extends Document>(
    filter: Document,
    { projection }: { projection?: Document } = {}
  ): Promise<T> {
    const result = await this.callApi<T>('findOne', {
      filter,
      projection
    })

    return result.document
  }

  async find<T extends Document>(
    filter?: Document,
    {
      projection,
      sort,
      limit,
      skip
    }: {
      projection?: Document
      sort?: Document
      limit?: number
      skip?: number
    } = {}
  ): Promise<T[]> {
    const result = await this.callApi<T>('find', {
      filter,
      projection,
      sort,
      limit,
      skip
    })
    return result.documents
  }

  updateOne(
    filter: Document,
    update: Document,
    { upsert }: { upsert?: boolean } = {}
  ): Promise<UpdateResult> {
    return this.callApi<UpdateResult>('updateOne', {
      filter,
      update,
      upsert
    })
  }

  updateMany(
    filter: Document,
    update: Document,
    { upsert }: { upsert?: boolean } = {}
  ): Promise<UpdateResult> {
    return this.callApi<UpdateResult>('updateMany', {
      filter,
      update,
      upsert
    })
  }

  replaceOne(
    filter: Document,
    replacement: Document,
    { upsert }: { upsert?: boolean } = {}
  ): Promise<UpdateResult> {
    return this.callApi<UpdateResult>('replaceOne', {
      filter,
      replacement,
      upsert
    })
  }

  deleteOne(filter: Document): Promise<DeleteResult> {
    return this.callApi<DeleteResult>('deleteOne', { filter })
  }

  deleteMany(filter: Document): Promise<DeleteResult> {
    return this.callApi<DeleteResult>('deleteMany', { filter })
  }

  async aggregate<T extends Document>(pipeline: Document[]): Promise<T[]> {
    const result = await this.callApi<T>('aggregate', { pipeline })
    return result.documents
  }

  async countDocuments(
    filter?: Document,
    options?: { limit?: number; skip?: number }
  ): Promise<number> {
    const pipeline: Document[] = []
    if (filter) {
      pipeline.push({ $match: filter })
    }

    if (typeof options?.skip === 'number') {
      pipeline.push({ $skip: options.skip })
    }

    if (typeof options?.limit === 'number') {
      pipeline.push({ $limit: options.limit })
    }

    pipeline.push({ $group: { _id: 1, n: { $sum: 1 } } })

    const [result] = await this.aggregate<{ n: number }>(pipeline)
    if (result) return result.n
    return 0
  }

  async estimatedDocumentCount(): Promise<number> {
    const pipeline = [
      { $collStats: { count: {} } },
      { $group: { _id: 1, n: { $sum: '$count' } } }
    ]

    const [result] = await this.aggregate<{ n: number }>(pipeline)
    if (result) return result.n
    return 0
  }

  async callApi<T>(method: string, extra: Document): Promise<T> {
    const { endpoint, dataSource, headers } = this.client
    const url = `${endpoint}/action/${method}`

    const response = await this.client.fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: this.name,
        database: this.database.name,
        dataSource: dataSource,
        ...extra
      })
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`${response.statusText}: ${body}`)
    }

    const responseJSON = await response.json()

    return responseJSON as T
  }
}
