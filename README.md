# MongoDB Atlas Data API
[Documentation](https://www.mongodb.com/docs/atlas/app-services/data-api/openapi/)

### Constructor

#### Authenticate via email and password

[Documentation](https://www.mongodb.com/docs/atlas/app-services/authentication/email-password/#std-label-email-password-authentication)

```ts
const client = new MongoClient({
  endpoint: 'https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1',
  dataSource: 'YOUR_CLUSTER_NAME', // e.g. "Cluster0"
  auth: {
    email: 'YOUR_EMAIL',
    password: 'YOUR_PASSWORD'
  }
})
```

#### Authenticate via api-key

[Documentation](https://www.mongodb.com/docs/atlas/app-services/authentication/api-key/#std-label-api-key-authentication)

```ts
const client = new MongoClient({
  endpoint: 'https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1',
  dataSource: 'YOUR_CLUSTER_NAME', // e.g. "Cluster0"
  auth: {
    apiKey: 'YOUR_API_KEY'
  }
})
```

#### Authenticate via custom JWT

[Documentation](https://www.mongodb.com/docs/atlas/app-services/authentication/custom-jwt/#std-label-custom-jwt-authentication)

```ts
const client = new MongoClient({
  endpoint: 'https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1',
  dataSource: 'YOUR_CLUSTER_NAME', // e.g. "Cluster0"
  auth: {
    jwtTokenString: 'YOUR_JWT'
  }
})
```

### Define Schema Type

```ts
interface UserSchema {
  _id: ObjectId
  username: string
  password: string
}

const db = client.database('test')
const users = db.collection('users')
```

### Insert

#### insertOne

```ts
const insertId = await users.insertOne({
  _id: new ObjectId(),
  username: 'user1',
  password: 'pass1'
})
```

#### insertMany

```ts
const insertIds = await users.insertMany([
  {
    _id: new ObjectId(),
    username: 'user1',
    password: 'pass1'
  },
  {
    _id: new ObjectId(),
    username: 'user2',
    password: 'pass2'
  }
])
```

### Find

#### findOne

```ts
const user1_id = await users.findOne<UserSchema>({
  _id: new ObjectId('SOME OBJECTID STRING')
})
```

#### find

```ts
const allActiveUsers = await users.find<UserSchema>({ active: true })
```

### Count

#### countDocuments

```ts
// count of all active users
const count = await users.countDocuments({ active: true })
```

#### estimatedDocumentCount

```ts
// estimated count of all users
const estimatedCount = await users.estimatedDocumentCount()
```

### Aggregation

```ts
const docs = await users.aggregate<UserSchema>([
  { $match: { username: 'many' } },
  { $group: { _id: '$username', total: { $sum: 1 } } }
])
```

### Update

#### updateOne

```ts
const { matchedCount, modifiedCount, upsertedId } = await users.updateOne(
  { username: { $ne: null } },
  { $set: { username: 'USERNAME' } }
)
```

#### updateMany

```ts
const { matchedCount, modifiedCount, upsertedId } = await users.updateMany(
  { username: { $ne: null } },
  { $set: { username: 'USERNAME' } }
)
```

### Replace

```ts
const { matchedCount, modifiedCount, upsertedId } = await users.replaceOne(
  { username: 'a' },
  {
    username: 'user1',
    password: 'pass1'
  } // new document
)
```

### Delete

#### deleteOne

```ts
const deleteCount = await users.deleteOne({ _id: insertId })
```

#### deleteMany

```ts
const deleteCount = await users.deleteMany({ username: 'test' })
```
