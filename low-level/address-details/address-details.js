/*
  Check the balance of the root address of an HD node wallet generated
  with the create-wallet example.
*/

// Set NETWORK to either testnet or mainnet
const NETWORK = 'testnet'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
// const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const TESTNET_API_FREE = 'http://localhost:12500/v2/'

// const MAINNET_API_PAID = 'https://api.fullstack.cash/v3/'
// const TESTNET_API_PAID = 'https://tapi.fullstack.cash/v3/'

const BCHJS = require('@chris.troutner/bch-js')

// Instantiate bch-js based on the network.
let bchjs
if (NETWORK === 'mainnet') bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
else bchjs = new BCHJS({ restURL: TESTNET_API_FREE })

// Open the wallet generated with create-wallet.
try {
  // var walletInfo = require('../../applications/wallet/create-wallet/wallet2.json')
  var walletInfo = require('../../applications/wallet/create-wallet/wallet.json')
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}

const ADDR = walletInfo.cashAddress

async function addressDetails () {
  try {
    // first get BCH balance
    const balance = await bchjs.Electrumx.balance(ADDR)

    console.log('BCH Balance information:')
    console.log(`${JSON.stringify(balance, null, 2)}`)
  } catch (err) {
    console.error('Error in getBalance: ', err)
    // throw err
  }
}
addressDetails()
