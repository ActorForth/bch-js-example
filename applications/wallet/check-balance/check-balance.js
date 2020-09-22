/*
  Check the balance of the root address of an HD node wallet generated
  with the create-wallet example.
*/

// uncomment to select network
// const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const REGTEST_API_FREE = 'http://localhost:3000/v3/'

const WALLET_NAME = `wallet-info-${NETWORK}`

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('@chris.troutner/bch-js')

// Instantiate bch-js based on the network.
let bchjs

switch (NETWORK) {
  case 'mainnet':
    bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
    break
  case 'testnet':
    bchjs = new BCHJS({ restURL: TESTNET_API_FREE })
    break
  case 'regtest':
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
    break
  default:
    bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
}

// Open the wallet generated within create-wallet.
try {
  var walletInfo = require(`../create-wallet/${WALLET_NAME}.json`)
  console.log('WALLETINFO', walletInfo)
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with create-wallet first.'
  )
  process.exit(0)
}

// Get the balance from address.
async function getBalance (address) {
  try {
    // first get BCH balance
    const balance = await bchjs.Electrumx.balance(address)

    console.log('BCH Balance information:')
    console.log(JSON.stringify(balance, null, 2))
  } catch (err) {
    console.error('Error in getBalance: ', err)
    throw err
  }
}

getBalance(walletInfo.cashAddress)
