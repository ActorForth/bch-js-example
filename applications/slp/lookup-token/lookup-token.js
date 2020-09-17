/*
  Get the token information based on the id.
*/

// EDIT THIS WITH THE TOKEN ID YOU WANT TO LOOK UP
const TOKENID = '61364f802ecfa57ec7a0f9fdf2f7b54562531cb372904bf44c4ccee270167e70'

// Set NETWORK to either testnet or mainnet
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'http://localhost:3000/v3/'
// const MAINNET_API_PAID = 'https://api.fullstack.cash/v3/'
// const TESTNET_API_PAID = 'https://tapi.fullstack.cash/v3/'

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('@chris.troutner/bch-js')

// Instantiate bch-js based on the network.
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
else bchjs = new BCHJS({ restURL: TESTNET_API_FREE })

async function lookupToken () {
  try {
    const properties = await bchjs.SLP.Utils.list(TOKENID)
    console.log(properties)
  } catch (err) {
    console.error('Error in getTokenInfo: ', err)
    throw err
  }
}
lookupToken()
