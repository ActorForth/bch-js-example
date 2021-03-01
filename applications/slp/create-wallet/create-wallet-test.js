/*
Create an HDNode wallet using bch-js. The mnemonic from this wallet
will be used by later examples.
*/

// uncomment to select network
const NETWORK = 'mainnet'
// const NETWORK = 'testnet'
// const NETWORK = 'regtest'

// REST API servers.
const MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
const TESTNET_API_FREE = 'https://free-test.fullstack.cash/v3/'
const REGTEST_API_FREE = 'http://128.199.203.157:3000/v3/'

const WALLET_NAME = `wallet-info-${NETWORK}-bid3`
console.log('WALLET_NAME', WALLET_NAME)

// bch-js-examples require code from the main bch-js repo
const BCHJS = require('bch-js-reg')

// Instantiate bch-js based on the network.
let bchjs
let regtest
switch (NETWORK) {
  case 'mainnet':
  bchjs = new BCHJS({ restURL: MAINNET_API_FREE })
  regtest = false
  break
  case 'testnet':
  bchjs = new BCHJS({ restURL: TESTNET_API_FREE })
  regtest = false
  break
  case 'regtest':
  bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
  regtest = true
  break
  default:
  bchjs = new BCHJS({ restURL: REGTEST_API_FREE })
  regtest = true
}

const fs = require('fs')

const lang = 'english' // Set the language of the wallet.

// These objects used for writing wallet information out to a file.
let outStr = ''
const outObj = {}


async function test () {
  try {
    let balances = await bchjs.SLP.Utils.balancesForAddress('simpleledger:qpgrl5zune275erlc0e4wpkkv8e0hdvqjga0ur8wwk','simpleledger:qz9uty8gnwce4hwz5vtlpasd4k5hc99q8ceygksdx0','simpleledger:qrrz2j27mywqclw79djfdwupr63308mtuqcr0v2yws');
      console.log(JSON.stringify(balances));
  } catch(error) {
   console.error(error)
  }
}
test ()
